package com.fixibleit.onedesk.data.remote

import com.fixibleit.onedesk.data.local.entity.CashLedgerEntity
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.CustomerTransactionEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTransactionEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTypeEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseEntity
import com.fixibleit.onedesk.data.local.entity.RiceProductEntity
import com.fixibleit.onedesk.data.local.entity.RiceStockMovementEntity
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.data.local.entity.SupplierTransactionEntity
import com.fixibleit.onedesk.data.local.entity.UserEntity
import com.fixibleit.onedesk.data.model.CashTxnType
import com.fixibleit.onedesk.data.model.CustomerTxnType
import com.fixibleit.onedesk.data.model.CylinderMaterial
import com.fixibleit.onedesk.data.model.CylinderTxnType
import com.fixibleit.onedesk.data.model.ReferenceType
import com.fixibleit.onedesk.data.model.RiceTxnType
import com.fixibleit.onedesk.data.model.SupplierTxnType
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.model.UserRole

/**
 * Every entity -> flat Firestore map (synced docs mirror Room rows exactly, one level deep,
 * so what you see in Firestore is exactly what is in the local ledger). syncStatus is deliberately
 * left out: it is a local-only bookkeeping column, never written to the cloud.
 */
object EntityMappers {

    fun toMap(e: UserEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "name" to e.name, "mobile" to e.mobile, "email" to e.email,
        "role" to e.role.name, "isActive" to e.isActive, "createdAt" to e.createdAt, "updatedAt" to e.updatedAt
    )

    fun userFromMap(m: Map<String, Any?>): UserEntity = UserEntity(
        id = m.str("id"), name = m.str("name"), mobile = m.str("mobile"), email = m.str("email"),
        role = UserRole.valueOf(m.str("role")), isActive = m.bool("isActive"),
        createdAt = m.long("createdAt"), updatedAt = m.long("updatedAt"), syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: CustomerEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "name" to e.name, "mobile" to e.mobile, "address" to e.address,
        "isActive" to e.isActive, "createdAt" to e.createdAt, "updatedAt" to e.updatedAt
    )

    fun customerFromMap(m: Map<String, Any?>): CustomerEntity = CustomerEntity(
        id = m.str("id"), name = m.str("name"), mobile = m.str("mobile"), address = m.str("address"),
        isActive = m.bool("isActive"), createdAt = m.long("createdAt"), updatedAt = m.long("updatedAt"),
        syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: CustomerTransactionEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "customerId" to e.customerId, "type" to e.type.name, "amountBDT" to e.amountBDT,
        "balanceAfter" to e.balanceAfter, "note" to e.note, "referenceType" to e.referenceType,
        "referenceId" to e.referenceId, "createdBy" to e.createdBy, "createdAt" to e.createdAt,
        "isReversed" to e.isReversed, "reversalOfId" to e.reversalOfId
    )

    fun customerTxnFromMap(m: Map<String, Any?>): CustomerTransactionEntity = CustomerTransactionEntity(
        id = m.str("id"), customerId = m.str("customerId"), type = CustomerTxnType.valueOf(m.str("type")),
        amountBDT = m.dbl("amountBDT"), balanceAfter = m.dbl("balanceAfter"), note = m.str("note"),
        referenceType = m.str("referenceType"), referenceId = m.strOrNull("referenceId"),
        createdBy = m.str("createdBy"), createdAt = m.long("createdAt"), isReversed = m.bool("isReversed"),
        reversalOfId = m.strOrNull("reversalOfId"), syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: SupplierEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "name" to e.name, "mobile" to e.mobile, "address" to e.address,
        "isActive" to e.isActive, "createdAt" to e.createdAt, "updatedAt" to e.updatedAt
    )

    fun supplierFromMap(m: Map<String, Any?>): SupplierEntity = SupplierEntity(
        id = m.str("id"), name = m.str("name"), mobile = m.str("mobile"), address = m.str("address"),
        isActive = m.bool("isActive"), createdAt = m.long("createdAt"), updatedAt = m.long("updatedAt"),
        syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: SupplierTransactionEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "supplierId" to e.supplierId, "type" to e.type.name, "amountBDT" to e.amountBDT,
        "balanceAfter" to e.balanceAfter, "note" to e.note, "referenceType" to e.referenceType,
        "referenceId" to e.referenceId, "createdBy" to e.createdBy, "createdAt" to e.createdAt,
        "isReversed" to e.isReversed, "reversalOfId" to e.reversalOfId
    )

    fun supplierTxnFromMap(m: Map<String, Any?>): SupplierTransactionEntity = SupplierTransactionEntity(
        id = m.str("id"), supplierId = m.str("supplierId"), type = SupplierTxnType.valueOf(m.str("type")),
        amountBDT = m.dbl("amountBDT"), balanceAfter = m.dbl("balanceAfter"), note = m.str("note"),
        referenceType = m.str("referenceType"), referenceId = m.strOrNull("referenceId"),
        createdBy = m.str("createdBy"), createdAt = m.long("createdAt"), isReversed = m.bool("isReversed"),
        reversalOfId = m.strOrNull("reversalOfId"), syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: RiceProductEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "name" to e.name, "purchasePricePerKgBDT" to e.purchasePricePerKgBDT,
        "sellingPricePerKgBDT" to e.sellingPricePerKgBDT, "kgPerSack" to e.kgPerSack,
        "isActive" to e.isActive, "createdAt" to e.createdAt, "updatedAt" to e.updatedAt
    )

    fun riceProductFromMap(m: Map<String, Any?>): RiceProductEntity = RiceProductEntity(
        id = m.str("id"), name = m.str("name"), purchasePricePerKgBDT = m.dbl("purchasePricePerKgBDT"),
        sellingPricePerKgBDT = m.dbl("sellingPricePerKgBDT"), kgPerSack = m.dbl("kgPerSack"),
        isActive = m.bool("isActive"), createdAt = m.long("createdAt"), updatedAt = m.long("updatedAt"),
        syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: RiceStockMovementEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "productId" to e.productId, "type" to e.type.name,
        "quantityKgDelta" to e.quantityKgDelta, "unitPriceBDT" to e.unitPriceBDT,
        "totalAmountBDT" to e.totalAmountBDT, "paidCashBDT" to e.paidCashBDT, "dueBDT" to e.dueBDT,
        "customerId" to e.customerId, "supplierId" to e.supplierId, "note" to e.note,
        "createdBy" to e.createdBy, "createdAt" to e.createdAt, "isReversed" to e.isReversed,
        "reversalOfId" to e.reversalOfId
    )

    fun riceMovementFromMap(m: Map<String, Any?>): RiceStockMovementEntity = RiceStockMovementEntity(
        id = m.str("id"), productId = m.str("productId"), type = RiceTxnType.valueOf(m.str("type")),
        quantityKgDelta = m.dbl("quantityKgDelta"), unitPriceBDT = m.dbl("unitPriceBDT"),
        totalAmountBDT = m.dbl("totalAmountBDT"), paidCashBDT = m.dbl("paidCashBDT"), dueBDT = m.dbl("dueBDT"),
        customerId = m.strOrNull("customerId"), supplierId = m.strOrNull("supplierId"), note = m.str("note"),
        createdBy = m.str("createdBy"), createdAt = m.long("createdAt"), isReversed = m.bool("isReversed"),
        reversalOfId = m.strOrNull("reversalOfId"), syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: CylinderTypeEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "brand" to e.brand, "sizeLabel" to e.sizeLabel, "material" to e.material.name,
        "purchasePriceBDT" to e.purchasePriceBDT, "sellingPriceBDT" to e.sellingPriceBDT,
        "depositAmountBDT" to e.depositAmountBDT, "isActive" to e.isActive,
        "createdAt" to e.createdAt, "updatedAt" to e.updatedAt
    )

    fun cylinderTypeFromMap(m: Map<String, Any?>): CylinderTypeEntity = CylinderTypeEntity(
        id = m.str("id"), brand = m.str("brand"), sizeLabel = m.str("sizeLabel"),
        material = CylinderMaterial.valueOf(m.str("material")), purchasePriceBDT = m.dbl("purchasePriceBDT"),
        sellingPriceBDT = m.dbl("sellingPriceBDT"), depositAmountBDT = m.dbl("depositAmountBDT"),
        isActive = m.bool("isActive"), createdAt = m.long("createdAt"), updatedAt = m.long("updatedAt"),
        syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: CylinderTransactionEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "cylinderTypeId" to e.cylinderTypeId, "type" to e.type.name,
        "customerId" to e.customerId, "supplierId" to e.supplierId, "quantity" to e.quantity,
        "fullCountDelta" to e.fullCountDelta, "emptyCountDelta" to e.emptyCountDelta,
        "customerHeldDelta" to e.customerHeldDelta, "depositLiabilityDeltaBDT" to e.depositLiabilityDeltaBDT,
        "amountBDT" to e.amountBDT, "paidCashBDT" to e.paidCashBDT, "dueBDT" to e.dueBDT,
        "note" to e.note, "createdBy" to e.createdBy, "createdAt" to e.createdAt,
        "isReversed" to e.isReversed, "reversalOfId" to e.reversalOfId
    )

    fun cylinderTxnFromMap(m: Map<String, Any?>): CylinderTransactionEntity = CylinderTransactionEntity(
        id = m.str("id"), cylinderTypeId = m.str("cylinderTypeId"), type = CylinderTxnType.valueOf(m.str("type")),
        customerId = m.strOrNull("customerId"), supplierId = m.strOrNull("supplierId"), quantity = m.int("quantity"),
        fullCountDelta = m.int("fullCountDelta"), emptyCountDelta = m.int("emptyCountDelta"),
        customerHeldDelta = m.int("customerHeldDelta"), depositLiabilityDeltaBDT = m.dbl("depositLiabilityDeltaBDT"),
        amountBDT = m.dbl("amountBDT"), paidCashBDT = m.dbl("paidCashBDT"), dueBDT = m.dbl("dueBDT"),
        note = m.str("note"), createdBy = m.str("createdBy"), createdAt = m.long("createdAt"),
        isReversed = m.bool("isReversed"), reversalOfId = m.strOrNull("reversalOfId"), syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: ExpenseCategoryEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "nameBn" to e.nameBn, "nameEn" to e.nameEn, "isCustom" to e.isCustom,
        "isActive" to e.isActive, "createdAt" to e.createdAt
    )

    fun expenseCategoryFromMap(m: Map<String, Any?>): ExpenseCategoryEntity = ExpenseCategoryEntity(
        id = m.str("id"), nameBn = m.str("nameBn"), nameEn = m.str("nameEn"), isCustom = m.bool("isCustom"),
        isActive = m.bool("isActive"), createdAt = m.long("createdAt"), syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: ExpenseEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "categoryId" to e.categoryId, "amountBDT" to e.amountBDT, "note" to e.note,
        "createdBy" to e.createdBy, "createdAt" to e.createdAt, "isReversed" to e.isReversed,
        "reversalOfId" to e.reversalOfId
    )

    fun expenseFromMap(m: Map<String, Any?>): ExpenseEntity = ExpenseEntity(
        id = m.str("id"), categoryId = m.str("categoryId"), amountBDT = m.dbl("amountBDT"), note = m.str("note"),
        createdBy = m.str("createdBy"), createdAt = m.long("createdAt"), isReversed = m.bool("isReversed"),
        reversalOfId = m.strOrNull("reversalOfId"), syncStatus = SyncStatus.SYNCED
    )

    fun toMap(e: CashLedgerEntity): Map<String, Any?> = mapOf(
        "id" to e.id, "type" to e.type.name, "amountBDT" to e.amountBDT,
        "referenceType" to e.referenceType.name, "referenceId" to e.referenceId, "note" to e.note,
        "createdBy" to e.createdBy, "createdAt" to e.createdAt
    )

    fun cashLedgerFromMap(m: Map<String, Any?>): CashLedgerEntity = CashLedgerEntity(
        id = m.str("id"), type = CashTxnType.valueOf(m.str("type")), amountBDT = m.dbl("amountBDT"),
        referenceType = ReferenceType.valueOf(m.str("referenceType")), referenceId = m.strOrNull("referenceId"),
        note = m.str("note"), createdBy = m.str("createdBy"), createdAt = m.long("createdAt"),
        syncStatus = SyncStatus.SYNCED
    )

    private fun Map<String, Any?>.str(key: String): String = this[key]?.toString().orEmpty()
    private fun Map<String, Any?>.strOrNull(key: String): String? = this[key]?.toString()
    private fun Map<String, Any?>.bool(key: String): Boolean = when (val v = this[key]) {
        is Boolean -> v
        is String -> v.toBoolean()
        else -> false
    }
    private fun Map<String, Any?>.long(key: String): Long = when (val v = this[key]) {
        is Number -> v.toLong()
        is String -> v.toLong()
        else -> 0L
    }
    private fun Map<String, Any?>.int(key: String): Int = when (val v = this[key]) {
        is Number -> v.toInt()
        is String -> v.toInt()
        else -> 0
    }
    private fun Map<String, Any?>.dbl(key: String): Double = when (val v = this[key]) {
        is Number -> v.toDouble()
        is String -> v.toDouble()
        else -> 0.0
    }
}
