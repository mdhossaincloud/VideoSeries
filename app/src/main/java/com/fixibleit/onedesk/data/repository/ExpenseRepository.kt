package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.CashLedgerDao
import com.fixibleit.onedesk.data.local.dao.ExpenseDao
import com.fixibleit.onedesk.data.local.entity.CashLedgerEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseEntity
import com.fixibleit.onedesk.data.model.CashTxnType
import com.fixibleit.onedesk.data.model.ReferenceType
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.remote.EntityMappers
import com.fixibleit.onedesk.data.sync.SyncEnqueuer
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.IdGenerator
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ExpenseRepository @Inject constructor(
    private val expenseDao: ExpenseDao,
    private val cashLedgerDao: CashLedgerDao,
    private val syncEnqueuer: SyncEnqueuer
) {
    fun observeCategories() = expenseDao.observeCategories()
    fun observeExpensesBetween(fromTs: Long, toTs: Long) = expenseDao.observeExpensesBetween(fromTs, toTs)
    fun observeTotalBetween(fromTs: Long, toTs: Long) = expenseDao.observeTotalBetween(fromTs, toTs)
    fun observeTotalsByCategory(fromTs: Long, toTs: Long) = expenseDao.observeTotalsByCategory(fromTs, toTs)

    suspend fun addCustomCategory(nameBn: String, nameEn: String): ExpenseCategoryEntity {
        val category = ExpenseCategoryEntity(
            id = IdGenerator.newId(), nameBn = nameBn, nameEn = nameEn, isCustom = true,
            createdAt = DateUtil.now(), syncStatus = SyncStatus.PENDING
        )
        expenseDao.upsertCategory(category)
        syncEnqueuer.enqueue("ExpenseCategory", category.id, EntityMappers.toMap(category), SyncOperation.CREATE)
        return category
    }

    suspend fun recordExpense(categoryId: String, amountBDT: Double, note: String, createdBy: String) {
        require(amountBDT > 0) { "Expense amount must be positive" }
        val now = DateUtil.now()
        val expense = ExpenseEntity(
            id = IdGenerator.newId(), categoryId = categoryId, amountBDT = amountBDT, note = note,
            createdBy = createdBy, createdAt = now, syncStatus = SyncStatus.PENDING
        )
        expenseDao.insertExpense(expense)
        syncEnqueuer.enqueue("Expense", expense.id, EntityMappers.toMap(expense), SyncOperation.CREATE)

        val cashEntry = CashLedgerEntity(
            id = IdGenerator.newId(), type = CashTxnType.EXPENSE_OUT, amountBDT = -amountBDT,
            referenceType = ReferenceType.EXPENSE, referenceId = expense.id, note = note,
            createdBy = createdBy, createdAt = now, syncStatus = SyncStatus.PENDING
        )
        cashLedgerDao.insert(cashEntry)
        syncEnqueuer.enqueue("CashLedgerEntry", cashEntry.id, EntityMappers.toMap(cashEntry), SyncOperation.CREATE)
    }
}
