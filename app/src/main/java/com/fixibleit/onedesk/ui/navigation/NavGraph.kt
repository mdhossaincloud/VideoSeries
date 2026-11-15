package com.fixibleit.onedesk.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.fixibleit.onedesk.ui.SessionViewModel
import com.fixibleit.onedesk.ui.screens.auth.LoginScreen
import com.fixibleit.onedesk.ui.screens.customer.AccountsScreen
import com.fixibleit.onedesk.ui.screens.customer.CustomerDetailScreen
import com.fixibleit.onedesk.ui.screens.dashboard.DashboardScreen
import com.fixibleit.onedesk.ui.screens.expense.ExpenseScreen
import com.fixibleit.onedesk.ui.screens.gas.CylinderScreen
import com.fixibleit.onedesk.ui.screens.reports.ReportsScreen
import com.fixibleit.onedesk.ui.screens.rice.RiceScreen
import com.fixibleit.onedesk.ui.screens.settings.SettingsScreen
import com.fixibleit.onedesk.ui.screens.settings.UserManagementScreen
import com.fixibleit.onedesk.ui.screens.supplier.SupplierDetailScreen
import com.fixibleit.onedesk.ui.theme.OneDeskTheme

@Composable
fun OneDeskApp(sessionViewModel: SessionViewModel = hiltViewModel()) {
    val session by sessionViewModel.uiState.collectAsState()

    OneDeskTheme(darkTheme = session.isDarkTheme) {
        if (session.currentUser == null) {
            LoginScreen(onLoggedIn = { /* session flow reacts automatically via currentUser */ })
        } else {
            MainNavHost()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainNavHost() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val showBottomBar = bottomNavRoutes.any { it.route == backStackEntry?.destination?.route }

    Scaffold(
        topBar = {
            if (showBottomBar) {
                CenterAlignedTopAppBar(
                    title = { Text("OneDesk Business") },
                    actions = {
                        IconButton(onClick = { navController.navigate(Screen.Reports.route) }) {
                            Icon(Icons.Filled.Assessment, contentDescription = "Reports")
                        }
                        IconButton(onClick = { navController.navigate(Screen.Settings.route) }) {
                            Icon(Icons.Filled.Settings, contentDescription = "Settings")
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors()
                )
            }
        },
        bottomBar = { if (showBottomBar) AppBottomBar(navController) }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(padding)
        ) {
            composable(Screen.Dashboard.route) { DashboardScreen() }
            composable(Screen.Rice.route) { RiceScreen() }
            composable(Screen.Cylinder.route) { CylinderScreen() }
            composable(Screen.Accounts.route) {
                AccountsScreen(
                    onOpenCustomer = { navController.navigate(Screen.CustomerDetail.build(it)) },
                    onOpenSupplier = { navController.navigate(Screen.SupplierDetail.build(it)) }
                )
            }
            composable(Screen.CustomerDetail.route) { CustomerDetailScreen() }
            composable(Screen.SupplierDetail.route) { SupplierDetailScreen() }
            composable(Screen.Expenses.route) { ExpenseScreen() }
            composable(Screen.Reports.route) { ReportsScreen() }
            composable(Screen.Settings.route) {
                SettingsScreen(
                    onManageUsers = { navController.navigate(Screen.UserManagement.route) },
                    onSignedOut = { navController.navigate(Screen.Dashboard.route) { popUpTo(0) } }
                )
            }
            composable(Screen.UserManagement.route) { UserManagementScreen() }
        }
    }
}
