package com.fixibleit.onedesk.domain.model

import com.fixibleit.onedesk.data.model.UserRole

/**
 * The one place that decides what Shop Staff can and cannot do, so a permission check is
 * never duplicated (and never drifts) across screens. Owner/Master Admin always passes.
 */
object RolePermissions {
    fun canDeleteOrReverseFinancialRecords(role: UserRole): Boolean = role == UserRole.OWNER
    fun canManageUsers(role: UserRole): Boolean = role == UserRole.OWNER
    fun canManageProductsAndCatalog(role: UserRole): Boolean = role == UserRole.OWNER
    fun canViewRestrictedReports(role: UserRole): Boolean = role == UserRole.OWNER
    fun canManageSyncAndBackup(role: UserRole): Boolean = role == UserRole.OWNER

    // Both roles can operate day-to-day:
    fun canRecordSales(role: UserRole): Boolean = true
    fun canRecordPurchases(role: UserRole): Boolean = true
    fun canRegisterCustomers(role: UserRole): Boolean = true
    fun canCollectPayments(role: UserRole): Boolean = true
    fun canRecordExpenses(role: UserRole): Boolean = true
    fun canViewDashboard(role: UserRole): Boolean = true
}
