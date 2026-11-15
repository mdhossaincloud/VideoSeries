package com.fixibleit.onedesk.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fixibleit.onedesk.data.model.RiceTxnType
import com.fixibleit.onedesk.data.model.SyncStatus

@Entity(tableName = "rice_products")
data class RiceProductEntity(
    @PrimaryKey val id: String,
    val name: String,
    val purchasePricePerKgBDT: Double,
    val sellingPricePerKgBDT: Double,
    val kgPerSack: Double = 50.0,
    val isActive: Boolean = true,
    val createdAt: Long,
    val updatedAt: Long,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)

/**
 * quantityKgDelta is signed: + for PURCHASE (stock increases), - for SALE (stock decreases).
 * Stock at any instant for a product = SUM(quantityKgDelta) up to that time.
 * paidCashBDT + dueBDT = totalAmountBDT (the split that feeds CashLedger and Customer/Supplier ledgers).
 */
@Entity(
    tableName = "rice_stock_movements",
    foreignKeys = [
        ForeignKey(entity = RiceProductEntity::class, parentColumns = ["id"], childColumns = ["productId"], onDelete = ForeignKey.RESTRICT)
    ],
    indices = [Index("productId"), Index("createdAt")]
)
data class RiceStockMovementEntity(
    @PrimaryKey val id: String,
    val productId: String,
    val type: RiceTxnType,
    val quantityKgDelta: Double,
    val unitPriceBDT: Double,
    val totalAmountBDT: Double,
    val paidCashBDT: Double,
    val dueBDT: Double,
    val customerId: String? = null,
    val supplierId: String? = null,
    val note: String = "",
    val createdBy: String,
    val createdAt: Long,
    val isReversed: Boolean = false,
    val reversalOfId: String? = null,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)
