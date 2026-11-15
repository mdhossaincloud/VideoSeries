package com.fixibleit.onedesk.data.remote

/**
 * Firestore layout (see docs/firestore.rules for the matching security rules):
 *   businesses/{businessId}/users/{userId}
 *   businesses/{businessId}/customers/{customerId}
 *   businesses/{businessId}/customer_transactions/{txnId}
 *   businesses/{businessId}/suppliers/{supplierId}
 *   businesses/{businessId}/supplier_transactions/{txnId}
 *   businesses/{businessId}/rice_products/{productId}
 *   businesses/{businessId}/rice_stock_movements/{movementId}
 *   businesses/{businessId}/cylinder_types/{typeId}
 *   businesses/{businessId}/cylinder_transactions/{txnId}
 *   businesses/{businessId}/expense_categories/{categoryId}
 *   businesses/{businessId}/expenses/{expenseId}
 *   businesses/{businessId}/cash_ledger/{entryId}
 *   businesses/{businessId}/audit_log/{logId}
 *
 * A single `businessId` document scopes Dubai Gas & Rice's whole data set, which is what
 * lets this same schema serve a second shop later just by changing the id.
 */
object FirestoreSchema {
    const val ROOT_COLLECTION = "businesses"
    const val DEFAULT_BUSINESS_ID = "dubai_gas_and_rice"

    const val USERS = "users"
    const val CUSTOMERS = "customers"
    const val CUSTOMER_TRANSACTIONS = "customer_transactions"
    const val SUPPLIERS = "suppliers"
    const val SUPPLIER_TRANSACTIONS = "supplier_transactions"
    const val RICE_PRODUCTS = "rice_products"
    const val RICE_STOCK_MOVEMENTS = "rice_stock_movements"
    const val CYLINDER_TYPES = "cylinder_types"
    const val CYLINDER_TRANSACTIONS = "cylinder_transactions"
    const val EXPENSE_CATEGORIES = "expense_categories"
    const val EXPENSES = "expenses"
    const val CASH_LEDGER = "cash_ledger"
    const val AUDIT_LOG = "audit_log"

    /** Maps the `entityType` recorded on a SyncQueueEntity to its Firestore sub-collection. */
    fun collectionFor(entityType: String): String = when (entityType) {
        "User" -> USERS
        "Customer" -> CUSTOMERS
        "CustomerTransaction" -> CUSTOMER_TRANSACTIONS
        "Supplier" -> SUPPLIERS
        "SupplierTransaction" -> SUPPLIER_TRANSACTIONS
        "RiceProduct" -> RICE_PRODUCTS
        "RiceStockMovement" -> RICE_STOCK_MOVEMENTS
        "CylinderType" -> CYLINDER_TYPES
        "CylinderTransaction" -> CYLINDER_TRANSACTIONS
        "ExpenseCategory" -> EXPENSE_CATEGORIES
        "Expense" -> EXPENSES
        "CashLedgerEntry" -> CASH_LEDGER
        "AuditLog" -> AUDIT_LOG
        else -> error("Unknown entityType for sync: $entityType")
    }
}
