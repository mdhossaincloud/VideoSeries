package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.CustomerDao
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.CustomerTransactionEntity
import com.fixibleit.onedesk.data.model.CustomerTxnType
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
class CustomerRepository @Inject constructor(
    private val dao: CustomerDao,
    private val syncEnqueuer: SyncEnqueuer,
    private val auditLogger: AuditLogger
) {
    fun observeCustomers() = dao.observeCustomers()
    fun observeDues(asOf: Long = DateUtil.now()) = dao.observeCustomerDues(asOf)
    fun observeTotalDue(asOf: Long = DateUtil.now()) = dao.observeTotalCustomerDue(asOf)
    fun observeTransactions(customerId: String) = dao.observeTransactions(customerId)
    suspend fun getById(id: String) = dao.getById(id)

    suspend fun addCustomer(name: String, mobile: String, address: String, openingBalanceBDT: Double, createdBy: String): CustomerEntity {
        val now = DateUtil.now()
        val customer = CustomerEntity(
            id = IdGenerator.newId(), name = name, mobile = mobile, address = address,
            createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
        )
        dao.upsertCustomer(customer)
        syncEnqueuer.enqueue("Customer", customer.id, EntityMappers.toMap(customer), SyncOperation.CREATE)

        if (openingBalanceBDT != 0.0) {
            recordTransaction(customer, CustomerTxnType.OPENING_BALANCE, openingBalanceBDT, "Opening balance", ReferenceType.NONE, null, createdBy)
        }
        return customer
    }

    suspend fun recordSaleOnCredit(customer: CustomerEntity, amountBDT: Double, referenceType: ReferenceType, referenceId: String?, note: String, createdBy: String) =
        recordTransaction(customer, CustomerTxnType.SALE_ON_CREDIT, amountBDT, note, referenceType, referenceId, createdBy)

    suspend fun recordPayment(customer: CustomerEntity, amountBDT: Double, note: String, createdBy: String) =
        recordTransaction(customer, CustomerTxnType.PAYMENT_RECEIVED, -amountBDT, note, ReferenceType.NONE, null, createdBy)

    /** Owner-only correction: posts a reversing entry rather than mutating the original row,
     * so the audit trail (and every device's copy of it) always shows both the mistake and the fix. */
    suspend fun reverseTransaction(original: CustomerTransactionEntity, reason: String, createdBy: String) {
        val customer = dao.getById(original.customerId) ?: return
        recordTransaction(customer, original.type, -original.amountBDT, "Reversal: $reason", ReferenceType.NONE, original.id, createdBy, reversalOfId = original.id)
        val flagged = original.copy(isReversed = true, syncStatus = SyncStatus.PENDING)
        dao.insertTransaction(flagged)
        syncEnqueuer.enqueue("CustomerTransaction", flagged.id, EntityMappers.toMap(flagged), SyncOperation.UPDATE)
        auditLogger.log("CustomerTransaction", original.id, "REVERSE", createdBy, EntityMappers.toMap(original).toString(), EntityMappers.toMap(flagged).toString(), reason)
    }

    private suspend fun recordTransaction(
        customer: CustomerEntity,
        type: CustomerTxnType,
        amountBDT: Double,
        note: String,
        referenceType: ReferenceType,
        referenceId: String?,
        createdBy: String,
        reversalOfId: String? = null
    ): CustomerTransactionEntity {
        val now = DateUtil.now()
        val currentDue = dao.dueAsOf(customer.id, now)
        val txn = CustomerTransactionEntity(
            id = IdGenerator.newId(), customerId = customer.id, type = type, amountBDT = amountBDT,
            balanceAfter = currentDue + amountBDT, note = note, referenceType = referenceType.name,
            referenceId = referenceId, createdBy = createdBy, createdAt = now, reversalOfId = reversalOfId,
            syncStatus = SyncStatus.PENDING
        )
        dao.recordTransactionAndBump(customer, txn)
        syncEnqueuer.enqueue("CustomerTransaction", txn.id, EntityMappers.toMap(txn), SyncOperation.CREATE)
        return txn
    }
}
