package com.fixibleit.onedesk.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.fixibleit.onedesk.data.local.dao.SyncQueueDao
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.remote.FirestoreSyncDataSource
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.JsonUtil
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.delay

/**
 * Drains the local outbox (see SyncQueueEntity) in order, pushing each row to Firestore.
 * A row that fails is marked FAILED with its error and attempt count and retried on the next
 * run with exponential backoff via WorkManager's own retry policy - nothing here ever drops
 * a record or silently gives up on it.
 */
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val syncQueueDao: SyncQueueDao,
    private val remote: FirestoreSyncDataSource
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        var anyFailure = false
        val batch = syncQueueDao.nextBatch(BATCH_SIZE)
        for (entry in batch) {
            if (entry.operation == SyncOperation.DELETE) {
                // Business data is never hard-deleted (see RemoteChangeApplier); nothing to push.
                syncQueueDao.updateStatus(entry.id, SyncStatus.SYNCED, DateUtil.now())
                continue
            }
            try {
                syncQueueDao.updateStatus(entry.id, SyncStatus.SYNCING, DateUtil.now())
                val data = JsonUtil.jsonToMap(entry.payloadJson)
                remote.push(entry.entityType, entry.entityId, data)
                syncQueueDao.updateStatus(entry.id, SyncStatus.SYNCED, DateUtil.now())
            } catch (t: Throwable) {
                anyFailure = true
                syncQueueDao.markFailed(entry.id, SyncStatus.FAILED, t.message ?: t.javaClass.simpleName, DateUtil.now())
                delay(200) // brief backoff before the next item in this batch
            }
        }
        syncQueueDao.pruneSynced(DateUtil.now() - SYNCED_RETENTION_MS)
        return if (anyFailure) Result.retry() else Result.success()
    }

    companion object {
        const val UNIQUE_PERIODIC_NAME = "onedesk_sync_periodic"
        const val UNIQUE_ONE_TIME_NAME = "onedesk_sync_now"
        private const val BATCH_SIZE = 25
        private const val SYNCED_RETENTION_MS = 7L * 24 * 60 * 60 * 1000
    }
}
