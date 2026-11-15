package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.SupplierDao
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.data.local.entity.SupplierTransactionEntity
import com.fixibleit.onedesk.data.model.ReferenceType
import com.fixibleit.onedesk.data.model.SupplierTxnType
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.remote.EntityMappers
import com.fixibleit.onedesk.data.sync.SyncEnqueuer
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.IdGenerator
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupplierRepository @Inject constructor(
    private val dao: SupplierDao,
    private val syncEnqueuer: SyncEnqueuer,
    private val auditLogger: AuditLogger
) {
    fun observeSuppliers() = dao.observeSuppliers()
    fun observePayables(asOf: Long = DateUtil.now()) = dao.observeSupplierPayables(asOf)
    fun observeTotalPayable(asOf: Long = DateUtil.now()) = dao.observeTotalSupplierPayable(asOf)
    fun observeTransactions(supplierId: String) = dao.observeTransactions(supplierId)
    suspend fun getById(id: String) = dao.getById(id)

    suspend fun addSupplier(name: String, mobile: String, address: String, openingBalanceBDT: Double, createdBy: String): SupplierEntity {
        val now = DateUtil.now()
        val supplier = SupplierEntity(
            id = IdGenerator.newId(), name = name, mobile = mobile, address = address,
            createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
        )
        dao.upsertSupplier(supplier)
        syncEnqueuer.enqueue("Supplier", supplier.id, EntityMappers.toMap(supplier), SyncOperation.CREATE)

        if (openingBalanceBDT != 0.0) {
            recordTransaction(supplier, SupplierTxnType.OPENING_BALANCE, openingBalanceBDT, "Opening balance", ReferenceType.NONE, null, createdBy)
        }
        return supplier
    }

    suspend fun recordPurchaseOnCredit(supplier: SupplierEntity, amountBDT: Double, referenceType: ReferenceType, referenceId: String?, note: String, createdBy: String) =
        recordTransaction(supplier, SupplierTxnType.PURCHASE_ON_CREDIT, amountBDT, note, referenceType, referenceId, createdBy)

    suspend fun recordPayment(supplier: SupplierEntity, amountBDT: Double, note: String, createdBy: String) =
        recordTransaction(supplier, SupplierTxnType.PAYMENT_MADE, -amountBDT, note, ReferenceType.NONE, null, createdBy)

    suspend fun reverseTransaction(original: SupplierTransactionEntity, reason: String, createdBy: String) {
        val supplier = dao.getById(original.supplierId) ?: return
        recordTransaction(supplier, original.type, -original.amountBDT, "Reversal: $reason", ReferenceType.NONE, original.id, createdBy)
        val flagged = original.copy(isReversed = true, syncStatus = SyncStatus.PENDING)
        dao.insertTransaction(flagged)
        syncEnqueuer.enqueue("SupplierTransaction", flagged.id, EntityMappers.toMap(flagged), SyncOperation.UPDATE)
        auditLogger.log("SupplierTransaction", original.id, "REVERSE", createdBy, EntityMappers.toMap(original).toString(), EntityMappers.toMap(flagged).toString(), reason)
    }

    private suspend fun recordTransaction(
        supplier: SupplierEntity,
        type: SupplierTxnType,
        amountBDT: Double,
        note: String,
        referenceType: ReferenceType,
        referenceId: String?,
        createdBy: String
    ): SupplierTransactionEntity {
        val now = DateUtil.now()
        val currentPayable = dao.payableAsOf(supplier.id, now)
        val txn = SupplierTransactionEntity(
            id = IdGenerator.newId(), supplierId = supplier.id, type = type, amountBDT = amountBDT,
            balanceAfter = currentPayable + amountBDT, note = note, referenceType = referenceType.name,
            referenceId = referenceId, createdBy = createdBy, createdAt = now, syncStatus = SyncStatus.PENDING
        )
        dao.recordTransactionAndBump(supplier, txn)
        syncEnqueuer.enqueue("SupplierTransaction", txn.id, EntityMappers.toMap(txn), SyncOperation.CREATE)
        return txn
    }
}
