package com.fixibleit.onedesk.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fixibleit.onedesk.data.model.SupplierTxnType
import com.fixibleit.onedesk.data.model.SyncStatus

@Entity(tableName = "suppliers")
data class SupplierEntity(
    @PrimaryKey val id: String,
    val name: String,
    val mobile: String,
    val address: String = "",
    val isActive: Boolean = true,
    val createdAt: Long,
    val updatedAt: Long,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)

/** amountBDT signed: + increases payable (PURCHASE_ON_CREDIT/OPENING_BALANCE), - decreases it (PAYMENT_MADE). */
@Entity(
    tableName = "supplier_transactions",
    foreignKeys = [
        ForeignKey(
            entity = SupplierEntity::class,
            parentColumns = ["id"],
            childColumns = ["supplierId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index("supplierId"), Index("createdAt")]
)
data class SupplierTransactionEntity(
    @PrimaryKey val id: String,
    val supplierId: String,
    val type: SupplierTxnType,
    val amountBDT: Double,
    val balanceAfter: Double,
    val note: String = "",
    val referenceType: String = "NONE",
    val referenceId: String? = null,
    val createdBy: String,
    val createdAt: Long,
    val isReversed: Boolean = false,
    val reversalOfId: String? = null,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)
