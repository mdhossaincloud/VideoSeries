@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.fixibleit.onedesk.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddBusiness
import androidx.compose.material.icons.filled.LocalGasStation
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fixibleit.onedesk.ui.common.LoadingState
import com.fixibleit.onedesk.ui.common.MoneyStatCard
import com.fixibleit.onedesk.ui.common.SectionHeader
import com.fixibleit.onedesk.ui.theme.DangerRed
import com.fixibleit.onedesk.ui.theme.GoldDeep
import com.fixibleit.onedesk.ui.theme.GoldRoyal
import com.fixibleit.onedesk.ui.theme.InfoBlue
import com.fixibleit.onedesk.ui.theme.NavyBase
import com.fixibleit.onedesk.ui.theme.NavyDeep
import com.fixibleit.onedesk.ui.theme.SuccessGreen
import com.fixibleit.onedesk.util.Money

@Composable
fun DashboardScreen(viewModel: DashboardViewModel = hiltViewModel()) {
    val snapshot by viewModel.snapshot.collectAsState()
    val options by viewModel.options.collectAsState()
    val message by viewModel.message.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(message) {
        message?.let { snackbarHostState.showSnackbar(it); viewModel.clearMessage() }
    }

    var activeQuickAction by remember { mutableStateOf<QuickAction?>(null) }

    val data = snapshot
    if (data == null) { LoadingState(); return }

    Box(Modifier.fillMaxWidth()) {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { BrandHeader(data.currentCashBDT) }

            item { QuickActionsRow(onAction = { activeQuickAction = it }) }

            item { SectionHeader("আজকের ব্যবসা — Today's Business") }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    MoneyStatCard("আজকের বিক্রিমূল্য\nToday's Selling Value", data.todaysSellingValueBDT, Modifier.weight(1f), SuccessGreen)
                    MoneyStatCard("আজকের মাল কেনা\nToday's Purchases", data.todaysPurchaseValueBDT, Modifier.weight(1f), GoldDeep)
                }
            }
            item {
                MoneyStatCard("আজকের দোকান খরচ\nToday's Expenses", data.todaysExpensesBDT, Modifier.fillMaxWidth(), DangerRed)
            }

            item { SectionHeader("ক্যাশ — Cash") }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    MoneyStatCard("আগের ক্যাশ\nOpening Cash", data.openingCashBDT, Modifier.weight(1f))
                    MoneyStatCard("বর্তমান ক্যাশ\nCurrent Cash", data.currentCashBDT, Modifier.weight(1f), SuccessGreen)
                }
            }

            item { SectionHeader("স্টক — Stock") }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    com.fixibleit.onedesk.ui.common.StatCard("আগের চাল স্টক\nOpening Rice", Money.formatKg(data.openingRiceStockKg), Modifier.weight(1f), InfoBlue)
                    com.fixibleit.onedesk.ui.common.StatCard("বর্তমান চাল স্টক\nCurrent Rice", Money.formatKg(data.currentRiceStockKg), Modifier.weight(1f), InfoBlue)
                }
            }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    com.fixibleit.onedesk.ui.common.StatCard("আগের বোতল (ভর্তি)\nOpening Full Cylinders", "${data.openingCylinderFullCount} pcs", Modifier.weight(1f), InfoBlue)
                    com.fixibleit.onedesk.ui.common.StatCard("বর্তমান বোতল (ভর্তি)\nCurrent Full Cylinders", "${data.currentCylinderFullCount} pcs", Modifier.weight(1f), InfoBlue)
                }
            }

            item { SectionHeader("পাওনা — Receivables & Payables") }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    MoneyStatCard("কাস্টমার পাওনা\nCustomer Due", data.totalCustomerDueBDT, Modifier.weight(1f), GoldDeep)
                    MoneyStatCard("সরবরাহকারী বাকি\nSupplier Payable", data.totalSupplierPayableBDT, Modifier.weight(1f), DangerRed)
                }
            }

            item { Spacer(Modifier.height(32.dp)) }
        }

        SnackbarHost(hostState = snackbarHostState, modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp)) {
            Snackbar(it, containerColor = NavyDeep, contentColor = GoldSoftOrWhite())
        }
    }

    activeQuickAction?.let { action ->
        QuickActionDialog(
            action = action,
            options = options,
            onDismiss = { activeQuickAction = null },
            onSellRice = { product, kg, price, cash, due, cust ->
                viewModel.quickSellRice(product, kg, price, cash, due, cust); activeQuickAction = null
            },
            onSellCylinder = { type, qty, price, cash, due, cust, exch, dep ->
                viewModel.quickSellCylinder(type, qty, price, cash, due, cust, exch, dep); activeQuickAction = null
            },
            onExpense = { catId, amt, note ->
                viewModel.quickRecordExpense(catId, amt, note); activeQuickAction = null
            },
            onReceivePayment = { cust, amt, note ->
                viewModel.quickReceivePayment(cust, amt, note); activeQuickAction = null
            }
        )
    }
}

@Composable
private fun GoldSoftOrWhite(): Color = MaterialTheme.colorScheme.onPrimary

/** Premium hero card: navy -> gold gradient strip with current cash headline. */
@Composable
private fun BrandHeader(currentCashBDT: Double) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(listOf(NavyDeep, NavyBase, GoldDeep.copy(alpha = 0.85f)))
                )
                .padding(20.dp)
        ) {
            Column {
                Text("Dubai Gas & Rice", color = GoldRoyal, style = MaterialTheme.typography.labelMedium)
                Text(
                    "OneDesk Business",
                    color = Color.White,
                    style = MaterialTheme.typography.headlineMedium
                )
                Spacer(Modifier.height(14.dp))
                Text("বর্তমান ক্যাশ • Current Cash", color = Color.White.copy(alpha = 0.85f), style = MaterialTheme.typography.labelSmall)
                Text(Money.format(currentCashBDT), color = GoldRoyal, style = MaterialTheme.typography.displaySmall)
            }
        }
    }
}

/** The Khatabook-style action row that answers the user's complaint "no sell option" - */
@Composable
private fun QuickActionsRow(onAction: (QuickAction) -> Unit) {
    val actions = listOf(
        QuickActionTile("বিক্রি করুন\nSell Rice", Icons.Filled.PointOfSale, SuccessGreen, QuickAction.SELL_RICE),
        QuickActionTile("গ্যাস বিক্রি\nSell Gas", Icons.Filled.LocalGasStation, InfoBlue, QuickAction.SELL_CYLINDER),
        QuickActionTile("পেমেন্ট নিন\nReceive Payment", Icons.Filled.Payments, GoldDeep, QuickAction.RECEIVE_PAYMENT),
        QuickActionTile("খরচ লিখুন\nRecord Expense", Icons.Filled.Receipt, DangerRed, QuickAction.EXPENSE)
    )
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        actions.forEach { tile ->
            Surface(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(18.dp)),
                color = tile.accent.copy(alpha = 0.12f),
                onClick = { onAction(tile.action) }
            ) {
                Column(
                    modifier = Modifier.padding(vertical = 14.dp, horizontal = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(tile.icon, contentDescription = null, tint = tile.accent, modifier = Modifier.size(28.dp))
                    Spacer(Modifier.height(6.dp))
                    Text(
                        tile.label,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onBackground,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        }
    }
}

private data class QuickActionTile(val label: String, val icon: ImageVector, val accent: Color, val action: QuickAction)

enum class QuickAction { SELL_RICE, SELL_CYLINDER, RECEIVE_PAYMENT, EXPENSE }
