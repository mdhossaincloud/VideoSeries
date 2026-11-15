package com.fixibleit.onedesk.data.sync

import com.fixibleit.onedesk.data.local.dao.CashLedgerDao
import com.fixibleit.onedesk.data.local.dao.CustomerDao
import com.fixibleit.onedesk.data.local.dao.CylinderDao
import com.fixibleit.onedesk.data.local.dao.ExpenseDao
import com.fixibleit.onedesk.data.local.dao.RiceDao
import com.fixibleit.onedesk.data.local.dao.SupplierDao
import com.fixibleit.onedesk.data.local.dao.UserDao
import com.fixibleit.onedesk.data.remote.EntityMappers
import com.fixibleit.onedesk.data.remote.RemoteChange
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Applies one Firestore change (made on another device) into the local Room cache.
 * Every target table's primary key is the entity's own id, so this is always a plain
 * upsert - never a silent overwrite of a *different* local record, and never a merge
 * that could corrupt a running ledger total.
 */
@Singleton
class RemoteChangeApplier @Inject constructor(
    private val userDao: UserDao,
    private val customerDao: CustomerDao,
    private val supplierDao: SupplierDao,
    private val riceDao: RiceDao,
    private val cylinderDao: CylinderDao,
    private val expenseDao: ExpenseDao,
    private val cashLedgerDao: CashLedgerDao
) {
    suspend fun apply(change: RemoteChange) {
        if (change.isDelete) return // business data is soft-deleted (isActive=false), never hard-deleted
        when (change.entityType) {
            "User" -> userDao.upsert(EntityMappers.userFromMap(change.data))
            "Customer" -> customerDao.upsertCustomer(EntityMappers.customerFromMap(change.data))
            "CustomerTransaction" -> customerDao.insertTransaction(EntityMappers.customerTxnFromMap(change.data))
            "Supplier" -> supplierDao.upsertSupplier(EntityMappers.supplierFromMap(change.data))
            "SupplierTransaction" -> supplierDao.insertTransaction(EntityMappers.supplierTxnFromMap(change.data))
            "RiceProduct" -> riceDao.upsertProduct(EntityMappers.riceProductFromMap(change.data))
            "RiceStockMovement" -> riceDao.insertMovement(EntityMappers.riceMovementFromMap(change.data))
            "CylinderType" -> cylinderDao.upsertType(EntityMappers.cylinderTypeFromMap(change.data))
            "CylinderTransaction" -> cylinderDao.insertTransaction(EntityMappers.cylinderTxnFromMap(change.data))
            "ExpenseCategory" -> expenseDao.upsertCategory(EntityMappers.expenseCategoryFromMap(change.data))
            "Expense" -> expenseDao.insertExpense(EntityMappers.expenseFromMap(change.data))
            "CashLedgerEntry" -> cashLedgerDao.insert(EntityMappers.cashLedgerFromMap(change.data))
        }
    }
}
