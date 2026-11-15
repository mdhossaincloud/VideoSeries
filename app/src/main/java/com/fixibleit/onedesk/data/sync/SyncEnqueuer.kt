package com.fixibleit.onedesk.data.sync

import com.fixibleit.onedesk.data.local.dao.SyncQueueDao
import com.fixibleit.onedesk.data.local.entity.SyncQueueEntity
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.IdGenerator
import com.fixibleit.onedesk.util.JsonUtil
import javax.inject.Inject
import javax.inject.Singleton

/**
 * The single call every repository makes right after a local Room write: queue it for the
 * cloud and nudge WorkManager to try immediately. The write to Room has already happened and
 * already succeeded by the time this runs, so the user never waits on the network.
 */
@Singleton
class SyncEnqueuer @Inject constructor(
    private val syncQueueDao: SyncQueueDao,
    private val syncScheduler: SyncScheduler
) {
    suspend fun enqueue(entityType: String, entityId: String, data: Map<String, Any?>, operation: SyncOperation = SyncOperation.CREATE) {
        val now = DateUtil.now()
        syncQueueDao.enqueue(
            SyncQueueEntity(
                id = IdGenerator.newId(),
                entityType = entityType,
                entityId = entityId,
                operation = operation,
                payloadJson = JsonUtil.mapToJson(data),
                createdAt = now,
                updatedAt = now
            )
        )
        syncScheduler.syncNow()
    }
}
