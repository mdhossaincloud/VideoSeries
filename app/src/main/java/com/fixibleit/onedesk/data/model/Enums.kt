package com.fixibleit.onedesk.data.model

/** Master Admin/Owner has full access; Shop Staff is restricted (see RolePermissions). */
enum class UserRole { OWNER, STAFF }

/** Lifecycle of one offline-first record as it moves toward the cloud. */
enum class SyncStatus { PENDING, SYNCING, SYNCED, FAILED }

enum class SyncOperation { CREATE, UPDATE, DELETE }

enum class CylinderMaterial { IRON, PLASTIC }

/**
 * Every type nets to a signed effect on fullCount / emptyCount / customerHeldCount / depositLiability,
 * computed by CylinderRepository when the transaction is created so reports only ever SUM() deltas.
 */
enum class CylinderTxnType {
    PURCHASE_REFILL,      // supplier delivers full cylinders: +full
    SALE_EXCHANGE,        // customer brings empty, takes full: -full +customerHeld(net 0 on count, cylinder moves to customer), +empty from the one they brought back... handled in repository
    SALE_NEW_WITH_DEPOSIT, // customer takes a full cylinder with no empty to exchange: -full, +customerHeld, +depositLiability
    CUSTOMER_RETURN_EMPTY, // customer returns an empty cylinder (e.g. closing an account): -customerHeld, +empty, -depositLiability (deposit refunded)
    EMPTY_RETURNED_TO_SUPPLIER, // -empty (sent back for refill)
    STOCK_ADJUSTMENT      // manual correction, owner only
}

enum class RiceTxnType { PURCHASE, SALE, ADJUSTMENT }

enum class CustomerTxnType { SALE_ON_CREDIT, PAYMENT_RECEIVED, ADJUSTMENT, OPENING_BALANCE }

enum class SupplierTxnType { PURCHASE_ON_CREDIT, PAYMENT_MADE, ADJUSTMENT, OPENING_BALANCE }

enum class CashTxnType {
    OPENING_BALANCE,
    SALE_CASH_IN,
    PAYMENT_RECEIVED_IN,
    EXPENSE_OUT,
    PURCHASE_CASH_OUT,
    SUPPLIER_PAYMENT_OUT,
    DEPOSIT_COLLECTED_IN,
    DEPOSIT_REFUNDED_OUT,
    ADJUSTMENT
}

/** Which business ledger a cash/sync entry refers back to, for traceability. */
enum class ReferenceType { RICE_STOCK, CYLINDER, CUSTOMER, SUPPLIER, EXPENSE, NONE }
