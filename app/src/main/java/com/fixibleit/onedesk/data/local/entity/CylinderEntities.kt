package com.fixibleit.onedesk.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fixibleit.onedesk.data.model.CylinderMaterial
import com.fixibleit.onedesk.data.model.CylinderTxnType
import com.fixibleit.onedesk.data.model.SyncStatus

@Entity(tableName = "cylinder_types")
data class CylinderTypeEntity(
    @PrimaryKey val id: String,
    val brand: String,
    val sizeLabel: String, // e.g. "12kg"
    val material: CylinderMaterial,
    val purchasePriceBDT: Double,
    val sellingPriceBDT: Double,
    val depositAmountBDT: Double,
    val isActive: Boolean = true,
    val createdAt: Long,
    val updatedAt: Long,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)

/**
 * Every row carries pre-computed signed deltas so inventory reports only ever SUM() them up to
 * a point in time (never recomputed from business rules at query time):
 *   fullCountDelta, emptyCountDelta, customerHeldDelta, depositLiabilityDeltaBDT.
 * CylinderRepository is the single place that decides these deltas per CylinderTxnType.
 */
@Entity(
    tableName = "cylinder_transactions",
    foreignKeys = [
        ForeignKey(entity = CylinderTypeEntity::class, parentColumns = ["id"], childColumns = ["cylinderTypeId"], onDelete = ForeignKey.RESTRICT)
    ],
    indices = [Index("cylinderTypeId"), Index("customerId"), Index("createdAt")]
)
data class CylinderTransactionEntity(
    @PrimaryKey val id: String,
    val cylinderTypeId: String,
    val type: CylinderTxnType,
    val customerId: String? = null,
    val supplierId: String? = null,
    val quantity: Int,
    val fullCountDelta: Int,
    val emptyCountDelta: Int,
    val customerHeldDelta: Int,
    val depositLiabilityDeltaBDT: Double,
    val amountBDT: Double,
    val paidCashBDT: Double,
    val dueBDT: Double,
    val note: String = "",
    val createdBy: String,
    val createdAt: Long,
    val isReversed: Boolean = false,
    val reversalOfId: String? = null,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)
