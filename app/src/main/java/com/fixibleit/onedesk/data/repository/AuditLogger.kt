package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.AuditLogDao
import com.fixibleit.onedesk.data.local.entity.AuditLogEntity
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.IdGenerator
import javax.inject.Inject
import javax.inject.Singleton

/** Owner-only corrections (reversed transactions, deactivated users, edited catalog prices)
 * are never silent: every one of them is recorded here before or alongside the change itself. */
@Singleton
class AuditLogger @Inject constructor(private val auditLogDao: AuditLogDao) {

    suspend fun log(entityType: String, entityId: String, action: String, performedByUserId: String, before: String?, after: String?, reason: String = "") {
        auditLogDao.insert(
            AuditLogEntity(
                id = IdGenerator.newId(), entityType = entityType, entityId = entityId, action = action,
                performedByUserId = performedByUserId, beforeJson = before, afterJson = after,
                reason = reason, createdAt = DateUtil.now()
            )
        )
    }

    fun observeFor(entityType: String, entityId: String) = auditLogDao.observeFor(entityType, entityId)
    fun observeRecent(limit: Int = 100) = auditLogDao.observeRecent(limit)
}
