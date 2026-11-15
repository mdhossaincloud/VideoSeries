package com.fixibleit.onedesk.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.fixibleit.onedesk.data.local.entity.AuditLogEntity
import com.fixibleit.onedesk.data.local.entity.SyncQueueEntity
import com.fixibleit.onedesk.data.model.SyncStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface SyncQueueDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueue(entry: SyncQueueEntity)

    @Query("SELECT * FROM sync_queue WHERE status IN ('PENDING', 'FAILED') ORDER BY createdAt ASC LIMIT :limit")
    suspend fun nextBatch(limit: Int = 25): List<SyncQueueEntity>

    @Query("UPDATE sync_queue SET status = :status, updatedAt = :now WHERE id = :id")
    suspend fun updateStatus(id: String, status: SyncStatus, now: Long)

    @Query("UPDATE sync_queue SET status = :status, attempts = attempts + 1, lastError = :error, updatedAt = :now WHERE id = :id")
    suspend fun markFailed(id: String, status: SyncStatus, error: String, now: Long)

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'PENDING'")
    fun observePendingCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'FAILED'")
    fun observeFailedCount(): Flow<Int>

    @Query("DELETE FROM sync_queue WHERE status = 'SYNCED' AND updatedAt < :olderThan")
    suspend fun pruneSynced(olderThan: Long)
}

@Dao
interface AuditLogDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: AuditLogEntity)

    @Query("SELECT * FROM audit_log WHERE entityType = :entityType AND entityId = :entityId ORDER BY createdAt DESC")
    fun observeFor(entityType: String, entityId: String): Flow<List<AuditLogEntity>>

    @Query("SELECT * FROM audit_log ORDER BY createdAt DESC LIMIT :limit")
    fun observeRecent(limit: Int = 100): Flow<List<AuditLogEntity>>
}
