package com.fixibleit.onedesk.ui.navigation

sealed class Screen(val route: String) {
    data object Login : Screen("login")

    data object Dashboard : Screen("dashboard")
    data object Rice : Screen("rice")
    data object RiceProductDetail : Screen("rice/{productId}") {
        fun build(productId: String) = "rice/$productId"
    }
    data object Cylinder : Screen("cylinder")
    data object CylinderTypeDetail : Screen("cylinder/{typeId}") {
        fun build(typeId: String) = "cylinder/$typeId"
    }
    data object Accounts : Screen("accounts")
    data object CustomerDetail : Screen("accounts/customer/{customerId}") {
        fun build(customerId: String) = "accounts/customer/$customerId"
    }
    data object SupplierDetail : Screen("accounts/supplier/{supplierId}") {
        fun build(supplierId: String) = "accounts/supplier/$supplierId"
    }
    data object Expenses : Screen("expenses")
    data object Reports : Screen("reports")
    data object Settings : Screen("settings")
    data object UserManagement : Screen("settings/users")
}

val bottomNavRoutes = listOf(Screen.Dashboard, Screen.Rice, Screen.Cylinder, Screen.Accounts, Screen.Expenses)
