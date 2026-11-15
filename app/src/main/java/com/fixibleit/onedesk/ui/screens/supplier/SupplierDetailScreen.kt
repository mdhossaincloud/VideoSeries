package com.fixibleit.onedesk.ui.screens.supplier

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fixibleit.onedesk.data.local.entity.SupplierTransactionEntity
import com.fixibleit.onedesk.ui.common.EmptyState
import com.fixibleit.onedesk.ui.common.MoneyStatCard
import com.fixibleit.onedesk.ui.screens.customer.AmountNoteDialog
import com.fixibleit.onedesk.ui.screens.customer.ReverseDialog
import com.fixibleit.onedesk.ui.theme.DangerRed
import com.fixibleit.onedesk.ui.theme.SuccessGreen
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.Money

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun SupplierDetailScreen(viewModel: SupplierDetailViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    var showPayment by remember { mutableStateOf(false) }
    var showCredit by remember { mutableStateOf(false) }
    var reverseTarget by remember { mutableStateOf<SupplierTransactionEntity?>(null) }

    Column(Modifier.fillMaxWidth().padding(16.dp)) {
        Text(state.supplier?.name ?: "", style = MaterialTheme.typography.headlineMedium)
        Text(state.supplier?.mobile ?: "", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

        MoneyStatCard("বাকি দিতে হবে (Outstanding Payable)", state.currentPayable, Modifier.fillMaxWidth().padding(top = 12.dp), if (state.currentPayable > 0) DangerRed else SuccessGreen)

        Row(Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = { showPayment = true }, modifier = Modifier.weight(1f)) { Text("Record Payment") }
            OutlinedButton(onClick = { showCredit = true }, modifier = Modifier.weight(1f)) { Text("Add Credit Purchase") }
        }

        Text("Transaction History", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 20.dp, bottom = 8.dp))

        if (state.transactions.isEmpty()) {
            EmptyState("No transactions yet.")
        } else {
            LazyColumn(contentPadding = PaddingValues(bottom = 24.dp)) {
                items(state.transactions, key = { it.id }) { txn ->
                    SupplierTransactionRow(txn, canReverse = state.canReverse && !txn.isReversed, onReverse = { reverseTarget = txn })
                }
            }
        }
    }

    if (showPayment) {
        AmountNoteDialog("Record Payment Made", onDismiss = { showPayment = false }, onConfirm = { amt, note ->
            viewModel.recordPayment(amt, note); showPayment = false
        })
    }
    if (showCredit) {
        AmountNoteDialog("Add Credit Purchase", onDismiss = { showCredit = false }, onConfirm = { amt, note ->
            viewModel.recordCreditPurchase(amt, note); showCredit = false
        })
    }
    reverseTarget?.let { txn ->
        ReverseDialog(onDismiss = { reverseTarget = null }, onConfirm = { reason ->
            viewModel.reverseTransaction(txn, reason); reverseTarget = null
        })
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun SupplierTransactionRow(txn: SupplierTransactionEntity, canReverse: Boolean, onReverse: () -> Unit) {
    val isIncrease = txn.amountBDT > 0
    Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(12.dp).combinedClickable(onClick = {}, onLongClick = { if (canReverse) onReverse() }),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(txn.type.name.replace('_', ' '), style = MaterialTheme.typography.titleSmall)
                Text(txn.note.ifBlank { DateUtil.formatDateTime(txn.createdAt) }, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(DateUtil.formatDateTime(txn.createdAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                if (txn.isReversed) Text("REVERSED", style = MaterialTheme.typography.labelSmall, color = DangerRed)
            }
            Text(
                (if (isIncrease) "+" else "") + Money.format(txn.amountBDT),
                style = MaterialTheme.typography.titleSmall,
                color = if (isIncrease) DangerRed else SuccessGreen
            )
        }
    }
}
