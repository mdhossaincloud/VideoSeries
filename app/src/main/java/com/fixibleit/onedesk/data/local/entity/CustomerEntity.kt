package com.fixibleit.onedesk.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fixibleit.onedesk.data.model.CustomerTxnType
import com.fixibleit.onedesk.data.model.SyncStatus

@Entity(tableName = "customers")
data class CustomerEntity(
    @PrimaryKey val id: String,
    val name: String,
    val mobile: String,
    val address: String = "",
    val isActive: Boolean = true,
    val createdAt: Long,
    val updatedAt: Long,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)

/**
 * amountBDT is signed: + increases the customer's due (SALE_ON_CREDIT / OPENING_BALANCE),
 * - decreases it (PAYMENT_RECEIVED). Outstanding due at any instant = SUM(amountBDT) up to that time.
 * balanceAfter is a denormalized snapshot kept only for fast display and audit trails,
 * never used as the source of truth for reports.
 */
@Entity(
    tableName = "customer_transactions",
    foreignKeys = [
        ForeignKey(
            entity = CustomerEntity::class,
            parentColumns = ["id"],
            childColumns = ["customerId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index("customerId"), Index("createdAt")]
)
data class CustomerTransactionEntity(
    @PrimaryKey val id: String,
    val customerId: String,
    val type: CustomerTxnType,
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
