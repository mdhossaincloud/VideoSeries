package com.fixibleit.onedesk.ui.screens.customer

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fixibleit.onedesk.ui.common.EmptyState
import com.fixibleit.onedesk.ui.theme.DangerRed
import com.fixibleit.onedesk.ui.theme.GoldDeep
import com.fixibleit.onedesk.util.Money

@Composable
fun AccountsScreen(
    viewModel: AccountsViewModel = hiltViewModel(),
    onOpenCustomer: (String) -> Unit,
    onOpenSupplier: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var tab by remember { mutableIntStateOf(0) }
    var showAdd by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showAdd = true }) { Icon(Icons.Filled.Add, contentDescription = "Add") }
        }
    ) { padding ->
        Column(Modifier.padding(top = padding.calculateTopPadding())) {
            TabRow(selectedTabIndex = tab) {
                Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("Customers (${state.customers.size})") })
                Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("Suppliers (${state.suppliers.size})") })
            }
            if (tab == 0) {
                if (state.customers.isEmpty()) {
                    EmptyState("No customers yet. Tap + to register your first customer.")
                } else {
                    LazyColumn(contentPadding = PaddingValues(16.dp)) {
                        items(state.customers, key = { it.id }) { c ->
                            Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp).clickable { onOpenCustomer(c.id) }) {
                                Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Column {
                                        Text(c.name, style = MaterialTheme.typography.titleSmall)
                                        Text(c.mobile, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                    Text(Money.format(c.dueBDT), style = MaterialTheme.typography.titleSmall, color = if (c.dueBDT > 0) GoldDeep else MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            } else {
                if (state.suppliers.isEmpty()) {
                    EmptyState("No suppliers yet. Tap + to add your first supplier.")
                } else {
                    LazyColumn(contentPadding = PaddingValues(16.dp)) {
                        items(state.suppliers, key = { it.id }) { s ->
                            Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp).clickable { onOpenSupplier(s.id) }) {
                                Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Column {
                                        Text(s.name, style = MaterialTheme.typography.titleSmall)
                                        Text(s.mobile, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                    Text(Money.format(s.payableBDT), style = MaterialTheme.typography.titleSmall, color = if (s.payableBDT > 0) DangerRed else MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAdd) {
        AddPartyDialog(
            isCustomer = tab == 0,
            onDismiss = { showAdd = false },
            onConfirm = { name, mobile, address, opening ->
                if (tab == 0) viewModel.addCustomer(name, mobile, address, opening) else viewModel.addSupplier(name, mobile, address, opening)
                showAdd = false
            }
        )
    }
}

@Composable
private fun AddPartyDialog(isCustomer: Boolean, onDismiss: () -> Unit, onConfirm: (String, String, String, Double) -> Unit) {
    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var opening by remember { mutableStateOf("0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (isCustomer) "Add Customer" else "Add Supplier") },
        text = {
            Column {
                OutlinedTextField(name, { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(mobile, { mobile = it }, label = { Text("Mobile") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(address, { address = it }, label = { Text("Address") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(opening, { opening = it }, label = { Text(if (isCustomer) "Opening due (BDT)" else "Opening payable (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(name, mobile, address, opening.toDoubleOrNull() ?: 0.0) }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
