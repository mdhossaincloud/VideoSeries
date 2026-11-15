package com.fixibleit.onedesk.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fixibleit.onedesk.data.model.SyncStatus

@Entity(tableName = "expense_categories")
data class ExpenseCategoryEntity(
    @PrimaryKey val id: String,
    val nameBn: String,
    val nameEn: String,
    val isCustom: Boolean = false,
    val isActive: Boolean = true,
    val createdAt: Long,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)

@Entity(
    tableName = "expenses",
    foreignKeys = [
        ForeignKey(entity = ExpenseCategoryEntity::class, parentColumns = ["id"], childColumns = ["categoryId"], onDelete = ForeignKey.RESTRICT)
    ],
    indices = [Index("categoryId"), Index("createdAt")]
)
data class ExpenseEntity(
    @PrimaryKey val id: String,
    val categoryId: String,
    val amountBDT: Double,
    val note: String = "",
    val createdBy: String,
    val createdAt: Long,
    val isReversed: Boolean = false,
    val reversalOfId: String? = null,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)
