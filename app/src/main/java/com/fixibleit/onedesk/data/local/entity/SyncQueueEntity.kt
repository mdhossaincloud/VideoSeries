package com.fixibleit.onedesk.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.data.model.SyncStatus

/**
 * Durable outbox: every local write enqueues one row here (same id as the entity's own id,
 * for CREATE/UPDATE on a given record, to naturally de-duplicate retries). SyncWorker drains
 * this queue in createdAt order, pushes to Firestore, marks SYNCED, or records the failure and
 * retries with backoff. Nothing in the UI ever waits on this — writes land locally first.
 */
@Entity(tableName = "sync_queue", indices = [Index("status"), Index("createdAt")])
data class SyncQueueEntity(
    @PrimaryKey val id: String,
    val entityType: String,
    val entityId: String,
    val operation: SyncOperation,
    val payloadJson: String,
    val status: SyncStatus = SyncStatus.PENDING,
    val attempts: Int = 0,
    val lastError: String? = null,
    val createdAt: Long,
    val updatedAt: Long
)

/** Owner-only audit trail for corrections ("edit or reverse transactions through audited corrections"). */
@Entity(tableName = "audit_log", indices = [Index("entityType", "entityId"), Index("createdAt")])
data class AuditLogEntity(
    @PrimaryKey val id: String,
    val entityType: String,
    val entityId: String,
    val action: String,
    val performedByUserId: String,
    val beforeJson: String?,
    val afterJson: String?,
    val reason: String = "",
    val createdAt: Long
)
