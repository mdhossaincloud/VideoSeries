package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.CashLedgerDao
import com.fixibleit.onedesk.data.local.dao.RiceDao
import com.fixibleit.onedesk.data.local.entity.CashLedgerEntity
import com.fixibleit.onedesk.data.local.entity.RiceProductEntity
import com.fixibleit.onedesk.data.local.entity.RiceStockMovementEntity
import com.fixibleit.onedesk.data.model.CashTxnType
import com.fixibleit.onedesk.data.model.ReferenceType
import com.fixibleit.onedesk.data.model.RiceTxnType
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.remote.EntityMappers
import com.fixibleit.onedesk.data.sync.SyncEnqueuer
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.IdGenerator
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Ties one rice stock movement to the two ledgers it affects, so a sale or purchase is
 * always posted as a single consistent unit: part cash (CashLedger), part credit
 * (Customer/Supplier ledger) - the two amounts a UI screen collects must sum to the total.
 */
@Singleton
class RiceRepository @Inject constructor(
    private val riceDao: RiceDao,
    private val cashLedgerDao: CashLedgerDao,
    private val customerRepository: CustomerRepository,
    private val supplierRepository: SupplierRepository,
    private val syncEnqueuer: SyncEnqueuer
) {
    fun observeProducts() = riceDao.observeProducts()
    fun observeStockAsOf(asOf: Long = DateUtil.now()) = riceDao.observeStockAsOf(asOf)
    fun observeTotalStockKgAsOf(asOf: Long = DateUtil.now()) = riceDao.observeTotalStockKgAsOf(asOf)
    fun observeMovements(productId: String) = riceDao.observeMovements(productId)
    fun observeProfitByProduct(fromTs: Long, toTs: Long) = riceDao.observeProfitByProduct(fromTs, toTs)
    fun observeTodayPurchaseValue(dayStart: Long, dayEnd: Long) = riceDao.observeTodayPurchaseValue(dayStart, dayEnd)
    fun observeTodaySalesValue(dayStart: Long, dayEnd: Long) = riceDao.observeTodaySalesValue(dayStart, dayEnd)
    suspend fun getProductById(id: String) = riceDao.getProductById(id)

    suspend fun addOrUpdateProduct(
        existingId: String?,
        name: String,
        purchasePricePerKgBDT: Double,
        sellingPricePerKgBDT: Double,
        kgPerSack: Double
    ): RiceProductEntity {
        val now = DateUtil.now()
        val product = RiceProductEntity(
            id = existingId ?: IdGenerator.newId(), name = name,
            purchasePricePerKgBDT = purchasePricePerKgBDT, sellingPricePerKgBDT = sellingPricePerKgBDT,
            kgPerSack = kgPerSack, createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
        )
        riceDao.upsertProduct(product)
        syncEnqueuer.enqueue("RiceProduct", product.id, EntityMappers.toMap(product), SyncOperation.CREATE)
        return product
    }

    suspend fun recordSale(
        product: RiceProductEntity,
        quantityKg: Double,
        unitPriceBDT: Double,
        paidCashBDT: Double,
        dueBDT: Double,
        customer: com.fixibleit.onedesk.data.local.entity.CustomerEntity?,
        note: String,
        createdBy: String
    ) {
        require(quantityKg > 0) { "Quantity must be positive" }
        val totalAmountBDT = paidCashBDT + dueBDT
        val now = DateUtil.now()
        val movement = RiceStockMovementEntity(
            id = IdGenerator.newId(), productId = product.id, type = RiceTxnType.SALE,
            quantityKgDelta = -quantityKg, unitPriceBDT = unitPriceBDT, totalAmountBDT = totalAmountBDT,
            paidCashBDT = paidCashBDT, dueBDT = dueBDT, customerId = customer?.id, note = note,
            createdBy = createdBy, createdAt = now, syncStatus = SyncStatus.PENDING
        )
        riceDao.insertMovement(movement)
        syncEnqueuer.enqueue("RiceStockMovement", movement.id, EntityMappers.toMap(movement), SyncOperation.CREATE)

        if (paidCashBDT > 0) postCash(CashTxnType.SALE_CASH_IN, paidCashBDT, movement.id, createdBy)
        if (dueBDT > 0 && customer != null) {
            customerRepository.recordSaleOnCredit(customer, dueBDT, ReferenceType.RICE_STOCK, movement.id, "Rice sale: ${product.name}", createdBy)
        }
    }

    suspend fun recordPurchase(
        product: RiceProductEntity,
        quantityKg: Double,
        unitPriceBDT: Double,
        paidCashBDT: Double,
        dueBDT: Double,
        supplier: com.fixibleit.onedesk.data.local.entity.SupplierEntity?,
        note: String,
        createdBy: String
    ) {
        require(quantityKg > 0) { "Quantity must be positive" }
        val totalAmountBDT = paidCashBDT + dueBDT
        val now = DateUtil.now()
        val movement = RiceStockMovementEntity(
            id = IdGenerator.newId(), productId = product.id, type = RiceTxnType.PURCHASE,
            quantityKgDelta = quantityKg, unitPriceBDT = unitPriceBDT, totalAmountBDT = totalAmountBDT,
            paidCashBDT = paidCashBDT, dueBDT = dueBDT, supplierId = supplier?.id, note = note,
            createdBy = createdBy, createdAt = now, syncStatus = SyncStatus.PENDING
        )
        riceDao.insertMovement(movement)
        syncEnqueuer.enqueue("RiceStockMovement", movement.id, EntityMappers.toMap(movement), SyncOperation.CREATE)

        if (paidCashBDT > 0) postCash(CashTxnType.PURCHASE_CASH_OUT, -paidCashBDT, movement.id, createdBy)
        if (dueBDT > 0 && supplier != null) {
            supplierRepository.recordPurchaseOnCredit(supplier, dueBDT, ReferenceType.RICE_STOCK, movement.id, "Rice purchase: ${product.name}", createdBy)
        }
    }

    /** Owner-only manual correction (e.g. spillage, miscount). */
    suspend fun recordStockAdjustment(product: RiceProductEntity, quantityKgDelta: Double, note: String, createdBy: String) {
        val now = DateUtil.now()
        val movement = RiceStockMovementEntity(
            id = IdGenerator.newId(), productId = product.id, type = RiceTxnType.ADJUSTMENT,
            quantityKgDelta = quantityKgDelta, unitPriceBDT = 0.0, totalAmountBDT = 0.0,
            paidCashBDT = 0.0, dueBDT = 0.0, note = note, createdBy = createdBy, createdAt = now,
            syncStatus = SyncStatus.PENDING
        )
        riceDao.insertMovement(movement)
        syncEnqueuer.enqueue("RiceStockMovement", movement.id, EntityMappers.toMap(movement), SyncOperation.CREATE)
    }

    private suspend fun postCash(type: CashTxnType, signedAmountBDT: Double, referenceId: String, createdBy: String) {
        val entry = CashLedgerEntity(
            id = IdGenerator.newId(), type = type, amountBDT = signedAmountBDT,
            referenceType = ReferenceType.RICE_STOCK, referenceId = referenceId,
            createdBy = createdBy, createdAt = DateUtil.now(), syncStatus = SyncStatus.PENDING
        )
        cashLedgerDao.insert(entry)
        syncEnqueuer.enqueue("CashLedgerEntry", entry.id, EntityMappers.toMap(entry), SyncOperation.CREATE)
    }
}
