package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.CashLedgerDao
import com.fixibleit.onedesk.data.local.dao.CylinderDao
import com.fixibleit.onedesk.data.local.entity.CashLedgerEntity
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTransactionEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTypeEntity
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.data.model.CashTxnType
import com.fixibleit.onedesk.data.model.CylinderMaterial
import com.fixibleit.onedesk.data.model.CylinderTxnType
import com.fixibleit.onedesk.data.model.ReferenceType
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.remote.EntityMappers
import com.fixibleit.onedesk.data.sync.SyncEnqueuer
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.IdGenerator
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Every cylinder movement is recorded as one row carrying its net effect on full/empty/
 * customer-held counts and on deposit liability (see CylinderTransactionEntity) - reports
 * never re-derive these from the transaction type at query time, only SUM() the columns.
 */
@Singleton
class CylinderRepository @Inject constructor(
    private val cylinderDao: CylinderDao,
    private val cashLedgerDao: CashLedgerDao,
    private val customerRepository: CustomerRepository,
    private val supplierRepository: SupplierRepository,
    private val syncEnqueuer: SyncEnqueuer
) {
    fun observeTypes() = cylinderDao.observeTypes()
    fun observeInventoryAsOf(asOf: Long = DateUtil.now()) = cylinderDao.observeInventoryAsOf(asOf)
    fun observeTotalFullAsOf(asOf: Long = DateUtil.now()) = cylinderDao.observeTotalFullAsOf(asOf)
    fun observeTotalEmptyAsOf(asOf: Long = DateUtil.now()) = cylinderDao.observeTotalEmptyAsOf(asOf)
    fun observeTotalCustomerHeldAsOf(asOf: Long = DateUtil.now()) = cylinderDao.observeTotalCustomerHeldAsOf(asOf)
    fun observeCustomerHoldings() = cylinderDao.observeCustomerHoldings()
    fun observeTransactions(typeId: String) = cylinderDao.observeTransactions(typeId)
    fun observeRecentExchanges(limit: Int = 50) = cylinderDao.observeRecentExchanges(limit)
    fun observeTodayPurchaseValue(dayStart: Long, dayEnd: Long) = cylinderDao.observeTodayPurchaseValue(dayStart, dayEnd)
    fun observeTodaySalesValue(dayStart: Long, dayEnd: Long) = cylinderDao.observeTodaySalesValue(dayStart, dayEnd)
    suspend fun getTypeById(id: String) = cylinderDao.getTypeById(id)

    suspend fun addOrUpdateType(
        existingId: String?,
        brand: String,
        sizeLabel: String,
        material: CylinderMaterial,
        purchasePriceBDT: Double,
        sellingPriceBDT: Double,
        depositAmountBDT: Double
    ): CylinderTypeEntity {
        val now = DateUtil.now()
        val type = CylinderTypeEntity(
            id = existingId ?: IdGenerator.newId(), brand = brand, sizeLabel = sizeLabel, material = material,
            purchasePriceBDT = purchasePriceBDT, sellingPriceBDT = sellingPriceBDT, depositAmountBDT = depositAmountBDT,
            createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
        )
        cylinderDao.upsertType(type)
        syncEnqueuer.enqueue("CylinderType", type.id, EntityMappers.toMap(type), SyncOperation.CREATE)
        return type
    }

    /** Supplier delivers refilled cylinders: shop's full count goes up. */
    suspend fun recordPurchaseRefill(
        type: CylinderTypeEntity, quantity: Int, unitCostBDT: Double,
        paidCashBDT: Double, dueBDT: Double, supplier: SupplierEntity?, note: String, createdBy: String
    ) {
        val amount = quantity * unitCostBDT
        insertTxn(
            type, CylinderTxnType.PURCHASE_REFILL, quantity, fullDelta = quantity, emptyDelta = 0,
            heldDelta = 0, depositDelta = 0.0, amountBDT = amount, paidCashBDT = paidCashBDT, dueBDT = dueBDT,
            customerId = null, supplierId = supplier?.id, note = note, createdBy = createdBy
        )
        if (paidCashBDT > 0) postCash(CashTxnType.PURCHASE_CASH_OUT, -paidCashBDT, createdBy)
        if (dueBDT > 0 && supplier != null) {
            supplierRepository.recordPurchaseOnCredit(supplier, dueBDT, ReferenceType.CYLINDER, type.id, "Cylinder refill: ${type.brand} ${type.sizeLabel}", createdBy)
        }
    }

    /** Normal refill exchange: customer brings an empty cylinder they already hold, takes a full one. */
    suspend fun recordSaleExchange(
        type: CylinderTypeEntity, quantity: Int, unitPriceBDT: Double,
        paidCashBDT: Double, dueBDT: Double, customer: CustomerEntity?, note: String, createdBy: String
    ) {
        val amount = quantity * unitPriceBDT
        insertTxn(
            type, CylinderTxnType.SALE_EXCHANGE, quantity, fullDelta = -quantity, emptyDelta = quantity,
            heldDelta = 0, depositDelta = 0.0, amountBDT = amount, paidCashBDT = paidCashBDT, dueBDT = dueBDT,
            customerId = customer?.id, supplierId = null, note = note, createdBy = createdBy
        )
        if (paidCashBDT > 0) postCash(CashTxnType.SALE_CASH_IN, paidCashBDT, createdBy)
        if (dueBDT > 0 && customer != null) {
            customerRepository.recordSaleOnCredit(customer, dueBDT, ReferenceType.CYLINDER, type.id, "Cylinder exchange: ${type.brand} ${type.sizeLabel}", createdBy)
        }
    }

    /** Customer has no empty to exchange: they take a full cylinder and leave a refundable deposit. */
    suspend fun recordSaleNewWithDeposit(
        type: CylinderTypeEntity, quantity: Int, unitPriceBDT: Double, depositPerUnitBDT: Double,
        paidCashBDT: Double, dueBDT: Double, customer: CustomerEntity, note: String, createdBy: String
    ) {
        val gasAmount = quantity * unitPriceBDT
        val depositAmount = quantity * depositPerUnitBDT
        val totalAmount = gasAmount + depositAmount
        require(paidCashBDT + dueBDT <= totalAmount + 0.01) { "Paid + due cannot exceed the total charge" }
        insertTxn(
            type, CylinderTxnType.SALE_NEW_WITH_DEPOSIT, quantity, fullDelta = -quantity, emptyDelta = 0,
            heldDelta = quantity, depositDelta = depositAmount, amountBDT = totalAmount,
            paidCashBDT = paidCashBDT, dueBDT = dueBDT, customerId = customer.id, supplierId = null,
            note = note, createdBy = createdBy
        )
        if (paidCashBDT > 0) postCash(CashTxnType.SALE_CASH_IN, paidCashBDT, createdBy)
        if (dueBDT > 0) {
            customerRepository.recordSaleOnCredit(customer, dueBDT, ReferenceType.CYLINDER, type.id, "New cylinder + deposit: ${type.brand} ${type.sizeLabel}", createdBy)
        }
    }

    /** Customer closes out / returns an empty cylinder; deposit liability clears, optionally refunded in cash. */
    suspend fun recordCustomerReturnEmpty(
        type: CylinderTypeEntity, quantity: Int, customer: CustomerEntity, refundDepositBDT: Double, note: String, createdBy: String
    ) {
        insertTxn(
            type, CylinderTxnType.CUSTOMER_RETURN_EMPTY, quantity, fullDelta = 0, emptyDelta = quantity,
            heldDelta = -quantity, depositDelta = -refundDepositBDT, amountBDT = refundDepositBDT,
            paidCashBDT = 0.0, dueBDT = 0.0, customerId = customer.id, supplierId = null, note = note, createdBy = createdBy
        )
        if (refundDepositBDT > 0) postCash(CashTxnType.DEPOSIT_REFUNDED_OUT, -refundDepositBDT, createdBy)
    }

    /** Empties sent back to the supplier/filling plant for refilling. */
    suspend fun recordEmptyReturnedToSupplier(type: CylinderTypeEntity, quantity: Int, supplier: SupplierEntity?, note: String, createdBy: String) {
        insertTxn(
            type, CylinderTxnType.EMPTY_RETURNED_TO_SUPPLIER, quantity, fullDelta = 0, emptyDelta = -quantity,
            heldDelta = 0, depositDelta = 0.0, amountBDT = 0.0, paidCashBDT = 0.0, dueBDT = 0.0,
            customerId = null, supplierId = supplier?.id, note = note, createdBy = createdBy
        )
    }

    /** Owner-only manual correction. */
    suspend fun recordStockAdjustment(type: CylinderTypeEntity, fullDelta: Int, emptyDelta: Int, note: String, createdBy: String) {
        insertTxn(
            type, CylinderTxnType.STOCK_ADJUSTMENT, quantity = Math.abs(fullDelta) + Math.abs(emptyDelta),
            fullDelta = fullDelta, emptyDelta = emptyDelta, heldDelta = 0, depositDelta = 0.0,
            amountBDT = 0.0, paidCashBDT = 0.0, dueBDT = 0.0, customerId = null, supplierId = null,
            note = note, createdBy = createdBy
        )
    }

    private suspend fun insertTxn(
        type: CylinderTypeEntity, txnType: CylinderTxnType, quantity: Int, fullDelta: Int, emptyDelta: Int,
        heldDelta: Int, depositDelta: Double, amountBDT: Double, paidCashBDT: Double, dueBDT: Double,
        customerId: String?, supplierId: String?, note: String, createdBy: String
    ) {
        val entity = CylinderTransactionEntity(
            id = IdGenerator.newId(), cylinderTypeId = type.id, type = txnType, customerId = customerId,
            supplierId = supplierId, quantity = quantity, fullCountDelta = fullDelta, emptyCountDelta = emptyDelta,
            customerHeldDelta = heldDelta, depositLiabilityDeltaBDT = depositDelta, amountBDT = amountBDT,
            paidCashBDT = paidCashBDT, dueBDT = dueBDT, note = note, createdBy = createdBy,
            createdAt = DateUtil.now(), syncStatus = SyncStatus.PENDING
        )
        cylinderDao.insertTransaction(entity)
        syncEnqueuer.enqueue("CylinderTransaction", entity.id, EntityMappers.toMap(entity), SyncOperation.CREATE)
    }

    private suspend fun postCash(type: CashTxnType, signedAmountBDT: Double, createdBy: String) {
        val entry = CashLedgerEntity(
            id = IdGenerator.newId(), type = type, amountBDT = signedAmountBDT,
            referenceType = ReferenceType.CYLINDER, referenceId = null,
            createdBy = createdBy, createdAt = DateUtil.now(), syncStatus = SyncStatus.PENDING
        )
        cashLedgerDao.insert(entry)
        syncEnqueuer.enqueue("CashLedgerEntry", entry.id, EntityMappers.toMap(entry), SyncOperation.CREATE)
    }
}
