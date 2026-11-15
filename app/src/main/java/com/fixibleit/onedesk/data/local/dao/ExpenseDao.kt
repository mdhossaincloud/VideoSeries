package com.fixibleit.onedesk.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseEntity
import kotlinx.coroutines.flow.Flow

data class ExpenseWithCategory(
    val id: String,
    val categoryId: String,
    val categoryNameBn: String,
    val categoryNameEn: String,
    val amountBDT: Double,
    val note: String,
    val createdAt: Long
)

data class ExpenseCategoryTotal(
    val categoryId: String,
    val categoryNameBn: String,
    val categoryNameEn: String,
    val totalBDT: Double
)

@Dao
interface ExpenseDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCategory(category: ExpenseCategoryEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: ExpenseEntity)

    @Query("SELECT * FROM expense_categories WHERE isActive = 1 ORDER BY nameBn ASC")
    fun observeCategories(): Flow<List<ExpenseCategoryEntity>>

    @Query("SELECT COUNT(*) FROM expense_categories")
    suspend fun categoryCount(): Int

    @Query(
        """
        SELECT e.id as id, e.categoryId as categoryId, c.nameBn as categoryNameBn, c.nameEn as categoryNameEn,
               e.amountBDT as amountBDT, e.note as note, e.createdAt as createdAt
        FROM expenses e
        JOIN expense_categories c ON c.id = e.categoryId
        WHERE e.isReversed = 0 AND e.createdAt BETWEEN :fromTs AND :toTs
        ORDER BY e.createdAt DESC
        """
    )
    fun observeExpensesBetween(fromTs: Long, toTs: Long): Flow<List<ExpenseWithCategory>>

    @Query(
        """
        SELECT COALESCE(SUM(amountBDT), 0.0) FROM expenses
        WHERE isReversed = 0 AND createdAt BETWEEN :fromTs AND :toTs
        """
    )
    fun observeTotalBetween(fromTs: Long, toTs: Long): Flow<Double>

    @Query(
        """
        SELECT c.id as categoryId, c.nameBn as categoryNameBn, c.nameEn as categoryNameEn,
               COALESCE(SUM(e.amountBDT), 0.0) as totalBDT
        FROM expense_categories c
        LEFT JOIN expenses e ON e.categoryId = c.id AND e.isReversed = 0 AND e.createdAt BETWEEN :fromTs AND :toTs
        WHERE c.isActive = 1
        GROUP BY c.id
        ORDER BY totalBDT DESC
        """
    )
    fun observeTotalsByCategory(fromTs: Long, toTs: Long): Flow<List<ExpenseCategoryTotal>>
}
