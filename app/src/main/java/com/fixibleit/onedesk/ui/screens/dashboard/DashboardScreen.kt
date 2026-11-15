package com.fixibleit.onedesk.ui.screens.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fixibleit.onedesk.ui.common.LoadingState
import com.fixibleit.onedesk.ui.common.MoneyStatCard
import com.fixibleit.onedesk.ui.common.SectionHeader
import com.fixibleit.onedesk.ui.theme.DangerRed
import com.fixibleit.onedesk.ui.theme.GoldDeep
import com.fixibleit.onedesk.ui.theme.InfoBlue
import com.fixibleit.onedesk.ui.theme.SuccessGreen
import com.fixibleit.onedesk.util.Money

private data class KpiRow(val title: String, val value: String, val accent: androidx.compose.ui.graphics.Color, val subtitle: String? = null)

@Composable
fun DashboardScreen(viewModel: DashboardViewModel = hiltViewModel()) {
    val snapshot by viewModel.snapshot.collectAsState()

    val data = snapshot
    if (data == null) {
        LoadingState()
        return
    }

    val stockRows = listOf(
        KpiRow("Opening Stock – Rice (আগের মালের স্টক)", Money.formatKg(data.openingRiceStockKg), InfoBlue),
        KpiRow("Current Stock – Rice (বর্তমান স্টক)", Money.formatKg(data.currentRiceStockKg), InfoBlue),
        KpiRow("Opening Stock – Full Cylinders", "${data.openingCylinderFullCount} pcs", InfoBlue),
        KpiRow("Current Stock – Full Cylinders", "${data.currentCylinderFullCount} pcs", InfoBlue)
    )

    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Dubai Gas & Rice", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground)
            Text("Today's business at a glance", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        item { SectionHeader("Today") }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MoneyStatCard("আজকের মাল কেনা (Today's Purchases)", data.todaysPurchaseValueBDT, Modifier.weight(1f), GoldDeep)
                MoneyStatCard("আজকের বিক্রিমূল্য (Today's Selling Value)", data.todaysSellingValueBDT, Modifier.weight(1f), SuccessGreen)
            }
        }
        item {
            MoneyStatCard("আজকের মোট দোকান খরচ (Today's Expenses)", data.todaysExpensesBDT, Modifier.fillMaxWidth(), DangerRed)
        }

        item { SectionHeader("Cash") }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MoneyStatCard("আগের ক্যাশ (Opening Cash)", data.openingCashBDT, Modifier.weight(1f))
                MoneyStatCard("বর্তমান ক্যাশ (Current Cash)", data.currentCashBDT, Modifier.weight(1f), SuccessGreen)
            }
        }

        item { SectionHeader("Stock") }
        items(stockRows.chunked(2)) { pair ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                pair.forEach { row ->
                    com.fixibleit.onedesk.ui.common.StatCard(row.title, row.value, Modifier.weight(1f), row.accent)
                }
                if (pair.size == 1) androidx.compose.foundation.layout.Spacer(Modifier.weight(1f))
            }
        }

        item { SectionHeader("Receivables & Payables") }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MoneyStatCard("কাস্টমার পাওনা (Customer Due)", data.totalCustomerDueBDT, Modifier.weight(1f), GoldDeep)
                MoneyStatCard("সরবরাহকারীর বাকি (Supplier Payable)", data.totalSupplierPayableBDT, Modifier.weight(1f), DangerRed)
            }
        }
    }
}
