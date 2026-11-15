package com.fixibleit.onedesk.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fixibleit.onedesk.data.model.CashTxnType
import com.fixibleit.onedesk.data.model.ReferenceType
import com.fixibleit.onedesk.data.model.SyncStatus

/**
 * The single source of truth for cash-in-hand. amountBDT is signed: + cash coming in,
 * - cash going out. Cash at any instant = SUM(amountBDT) up to that time, so
 * "opening cash today" and "current cash" are the same query with different cutoffs
 * (see CashLedgerDao) and can never drift into two different numbers.
 */
@Entity(tableName = "cash_ledger", indices = [Index("createdAt"), Index("referenceType", "referenceId")])
data class CashLedgerEntity(
    @PrimaryKey val id: String,
    val type: CashTxnType,
    val amountBDT: Double,
    val referenceType: ReferenceType = ReferenceType.NONE,
    val referenceId: String? = null,
    val note: String = "",
    val createdBy: String,
    val createdAt: Long,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)
