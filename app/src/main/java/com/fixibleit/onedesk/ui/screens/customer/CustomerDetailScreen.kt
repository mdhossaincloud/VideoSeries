package com.fixibleit.onedesk.ui.screens.customer

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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fixibleit.onedesk.data.local.entity.CustomerTransactionEntity
import com.fixibleit.onedesk.ui.common.EmptyState
import com.fixibleit.onedesk.ui.common.MoneyStatCard
import com.fixibleit.onedesk.ui.theme.DangerRed
import com.fixibleit.onedesk.ui.theme.SuccessGreen
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.Money

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CustomerDetailScreen(viewModel: CustomerDetailViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    var showPayment by remember { mutableStateOf(false) }
    var showCredit by remember { mutableStateOf(false) }
    var reverseTarget by remember { mutableStateOf<CustomerTransactionEntity?>(null) }

    Column(Modifier.fillMaxWidth().padding(16.dp)) {
        Text(state.customer?.name ?: "", style = MaterialTheme.typography.headlineMedium)
        Text(state.customer?.mobile ?: "", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

        MoneyStatCard("বাকি আছে (Outstanding Due)", state.currentDue, Modifier.fillMaxWidth().padding(top = 12.dp), if (state.currentDue > 0) DangerRed else SuccessGreen)

        Row(Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = { showPayment = true }, modifier = Modifier.weight(1f)) { Text("Record Payment") }
            OutlinedButton(onClick = { showCredit = true }, modifier = Modifier.weight(1f)) { Text("Add Credit Sale") }
        }

        Text("Transaction History", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 20.dp, bottom = 8.dp))

        if (state.transactions.isEmpty()) {
            EmptyState("No transactions yet.")
        } else {
            LazyColumn(contentPadding = PaddingValues(bottom = 24.dp)) {
                items(state.transactions, key = { it.id }) { txn ->
                    TransactionRow(txn, canReverse = state.canReverse && !txn.isReversed, onReverse = { reverseTarget = txn })
                }
            }
        }
    }

    if (showPayment) {
        AmountNoteDialog("Record Payment Received", onDismiss = { showPayment = false }, onConfirm = { amt, note ->
            viewModel.recordPayment(amt, note); showPayment = false
        })
    }
    if (showCredit) {
        AmountNoteDialog("Add Credit Sale", onDismiss = { showCredit = false }, onConfirm = { amt, note ->
            viewModel.recordCreditSale(amt, note); showCredit = false
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
private fun TransactionRow(txn: CustomerTransactionEntity, canReverse: Boolean, onReverse: () -> Unit) {
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

@Composable
internal fun AmountNoteDialog(title: String, onDismiss: () -> Unit, onConfirm: (Double, String) -> Unit) {
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column {
                OutlinedTextField(amount, { amount = it }, label = { Text("Amount (BDT)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(note, { note = it }, label = { Text("Note") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val amt = amount.toDoubleOrNull() ?: 0.0
                if (amt > 0) onConfirm(amt, note)
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
internal fun ReverseDialog(onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var reason by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Reverse this transaction?") },
        text = {
            Column {
                Text("This posts an audited reversing entry; the original stays visible in history.", style = MaterialTheme.typography.bodySmall)
                OutlinedTextField(reason, { reason = it }, label = { Text("Reason") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = { TextButton(onClick = { onConfirm(reason) }) { Text("Reverse") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
