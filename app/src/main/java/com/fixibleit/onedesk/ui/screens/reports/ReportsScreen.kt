package com.fixibleit.onedesk.ui.screens.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fixibleit.onedesk.ui.common.EmptyState
import com.fixibleit.onedesk.ui.common.LoadingState
import com.fixibleit.onedesk.ui.common.MoneyStatCard
import com.fixibleit.onedesk.ui.common.SectionHeader
import com.fixibleit.onedesk.ui.theme.DangerRed
import com.fixibleit.onedesk.ui.theme.GoldDeep
import com.fixibleit.onedesk.ui.theme.SuccessGreen
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.Money

@Composable
fun ReportsScreen(viewModel: ReportsViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    val snapshot = state.snapshot

    if (snapshot == null) {
        LoadingState()
        return
    }

    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("Reports", style = MaterialTheme.typography.headlineMedium) }

        item { SectionHeader("Today's Purchase & Sales") }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MoneyStatCard("Purchases", snapshot.todaysPurchaseValueBDT, Modifier.weight(1f), GoldDeep)
                MoneyStatCard("Selling Value", snapshot.todaysSellingValueBDT, Modifier.weight(1f), SuccessGreen)
            }
        }

        item { SectionHeader("Stock: Opening vs Current") }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                com.fixibleit.onedesk.ui.common.StatCard("Rice – Opening", Money.formatKg(snapshot.openingRiceStockKg), Modifier.weight(1f))
                com.fixibleit.onedesk.ui.common.StatCard("Rice – Current", Money.formatKg(snapshot.currentRiceStockKg), Modifier.weight(1f))
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                com.fixibleit.onedesk.ui.common.StatCard("Full Cylinders – Opening", "${snapshot.openingCylinderFullCount}", Modifier.weight(1f))
                com.fixibleit.onedesk.ui.common.StatCard("Full Cylinders – Current", "${snapshot.currentCylinderFullCount}", Modifier.weight(1f))
            }
        }

        item { SectionHeader("Estimated Gross Profit (Today, Rice)") }
        item { MoneyStatCard("Gross Profit", state.todaysGrossProfitBDT, Modifier.fillMaxWidth(), SuccessGreen) }
        if (state.profitByProduct.any { it.soldKg > 0 }) {
            items(state.profitByProduct.filter { it.soldKg > 0 }, key = { it.productId }) { p ->
                Card(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(p.productName, style = MaterialTheme.typography.titleSmall)
                            Text("${Money.formatKg(p.soldKg)} sold", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Text(Money.format(p.grossProfitBDT), style = MaterialTheme.typography.titleSmall, color = SuccessGreen)
                    }
                }
            }
        }

        item { SectionHeader("Today's Cash Movement") }
        if (state.cashMovementToday.isEmpty()) {
            item { EmptyState("No cash movement recorded today yet.") }
        }
        items(state.cashMovementToday, key = { it.id }) { c ->
            Card(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text(c.type.name.replace('_', ' '), style = MaterialTheme.typography.titleSmall)
                        Text(DateUtil.formatDateTime(c.createdAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                    }
                    Text(
                        (if (c.amountBDT >= 0) "+" else "") + Money.format(c.amountBDT),
                        color = if (c.amountBDT >= 0) SuccessGreen else DangerRed,
                        style = MaterialTheme.typography.titleSmall
                    )
                }
            }
        }

        item { SectionHeader("Cylinder Exchange History") }
        if (state.cylinderExchanges.isEmpty()) {
            item { EmptyState("No cylinder exchanges recorded yet.") }
        }
        items(state.cylinderExchanges, key = { it.id }) { x ->
            Card(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("${x.quantity} pcs", style = MaterialTheme.typography.titleSmall)
                    Text(DateUtil.formatDateTime(x.createdAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                    Text(Money.format(x.amountBDT), style = MaterialTheme.typography.titleSmall)
                }
            }
        }
    }
}
