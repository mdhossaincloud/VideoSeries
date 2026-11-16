@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.fixibleit.onedesk.ui.screens.rice

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
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
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
import com.fixibleit.onedesk.data.local.dao.RiceProductStock
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.ui.common.EmptyState
import com.fixibleit.onedesk.ui.common.SectionHeader
import com.fixibleit.onedesk.util.Money

@Composable
fun RiceScreen(viewModel: RiceViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    var showAddProduct by remember { mutableStateOf(false) }
    var actionTarget by remember { mutableStateOf<RiceProductStock?>(null) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddProduct = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Add rice product")
            }
        }
    ) { padding ->
        val contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = padding.calculateTopPadding() + 16.dp, bottom = 88.dp)
        LazyColumn(contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { SectionHeader("চাল স্টক (Rice Inventory)") }
            if (state.products.isEmpty()) {
                item { EmptyState("No rice products yet. Tap + to add your first product (e.g. Miniket, Nazirshail, BR28).") }
            }
            items(state.products, key = { it.id }) { product ->
                RiceProductCard(product, onAction = { actionTarget = product })
            }
        }
    }

    if (showAddProduct) {
        AddRiceProductDialog(onDismiss = { showAddProduct = false }, onConfirm = { name, pp, sp, sack ->
            viewModel.addProduct(name, pp, sp, sack); showAddProduct = false
        })
    }

    actionTarget?.let { product ->
        RiceActionDialog(
            product = product,
            customers = state.customers,
            suppliers = state.suppliers,
            onDismiss = { actionTarget = null },
            onSale = { qty, price, cash, due, customer ->
                viewModel.recordSale(product, qty, price, cash, due, customer); actionTarget = null
            },
            onPurchase = { qty, price, cash, due, supplier ->
                viewModel.recordPurchase(product, qty, price, cash, due, supplier); actionTarget = null
            }
        )
    }
}

@Composable
private fun RiceProductCard(product: RiceProductStock, onAction: () -> Unit) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(product.name, style = MaterialTheme.typography.titleMedium)
                AssistChip(onClick = onAction, label = { Text("Buy / Sell") })
            }
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(Money.formatKg(product.currentStockKg), style = MaterialTheme.typography.titleSmall)
                    Text("in stock", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Column {
                    Text(Money.format(product.purchasePricePerKgBDT) + "/kg", style = MaterialTheme.typography.bodySmall)
                    Text("purchase", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Column {
                    Text(Money.format(product.sellingPricePerKgBDT) + "/kg", style = MaterialTheme.typography.bodySmall)
                    Text("selling", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
private fun AddRiceProductDialog(onDismiss: () -> Unit, onConfirm: (String, Double, Double, Double) -> Unit) {
    var name by remember { mutableStateOf("") }
    var purchasePrice by remember { mutableStateOf("") }
    var sellingPrice by remember { mutableStateOf("") }
    var kgPerSack by remember { mutableStateOf("50") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Rice Product") },
        text = {
            Column {
                OutlinedTextField(name, { name = it }, label = { Text("Name (e.g. Miniket)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(purchasePrice, { purchasePrice = it }, label = { Text("Purchase price / kg (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(sellingPrice, { sellingPrice = it }, label = { Text("Selling price / kg (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(kgPerSack, { kgPerSack = it }, label = { Text("Kg per sack/bag") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                onConfirm(name, purchasePrice.toDoubleOrNull() ?: 0.0, sellingPrice.toDoubleOrNull() ?: 0.0, kgPerSack.toDoubleOrNull() ?: 50.0)
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun RiceActionDialog(
    product: RiceProductStock,
    customers: List<CustomerEntity>,
    suppliers: List<SupplierEntity>,
    onDismiss: () -> Unit,
    onSale: (Double, Double, Double, Double, CustomerEntity?) -> Unit,
    onPurchase: (Double, Double, Double, Double, SupplierEntity?) -> Unit
) {
    var isSale by remember { mutableStateOf(true) }
    var quantitySack by remember { mutableStateOf("") }
    var quantityKgExtra by remember { mutableStateOf("") }
    var unitPrice by remember { mutableStateOf(if (isSale) product.sellingPricePerKgBDT.toString() else product.purchasePricePerKgBDT.toString()) }
    var cash by remember { mutableStateOf("") }
    var due by remember { mutableStateOf("0") }
    var partyExpanded by remember { mutableStateOf(false) }
    var selectedCustomer by remember { mutableStateOf<CustomerEntity?>(null) }
    var selectedSupplier by remember { mutableStateOf<SupplierEntity?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(product.name) },
        text = {
            Column {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = { isSale = true }, label = { Text("Sell") })
                    AssistChip(onClick = { isSale = false }, label = { Text("Buy") })
                }
                Text(
                    "1 sack = ${Money.formatKg(product.kgPerSack)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Row(Modifier.padding(top = 8.dp)) {
                    OutlinedTextField(quantitySack, { quantitySack = it }, label = { Text("Sacks") }, modifier = Modifier.weight(1f))
                    androidx.compose.foundation.layout.Spacer(Modifier.padding(horizontal = 4.dp))
                    OutlinedTextField(quantityKgExtra, { quantityKgExtra = it }, label = { Text("+ extra kg") }, modifier = Modifier.weight(1f))
                }
                OutlinedTextField(unitPrice, { unitPrice = it }, label = { Text("Unit price / kg (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))

                ExposedDropdownMenuBox(expanded = partyExpanded, onExpandedChange = { partyExpanded = it }, modifier = Modifier.padding(top = 8.dp)) {
                    OutlinedTextField(
                        value = if (isSale) (selectedCustomer?.name ?: "Walk-in (cash sale)") else (selectedSupplier?.name ?: "Cash purchase (no supplier)"),
                        onValueChange = {}, readOnly = true,
                        label = { Text(if (isSale) "Customer" else "Supplier") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = partyExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor()
                    )
                    ExposedDropdownMenu(expanded = partyExpanded, onDismissRequest = { partyExpanded = false }) {
                        if (isSale) {
                            DropdownMenuItem(text = { Text("Walk-in (cash sale)") }, onClick = { selectedCustomer = null; partyExpanded = false })
                            customers.forEach { c -> DropdownMenuItem(text = { Text(c.name) }, onClick = { selectedCustomer = c; partyExpanded = false }) }
                        } else {
                            DropdownMenuItem(text = { Text("Cash purchase (no supplier)") }, onClick = { selectedSupplier = null; partyExpanded = false })
                            suppliers.forEach { s -> DropdownMenuItem(text = { Text(s.name) }, onClick = { selectedSupplier = s; partyExpanded = false }) }
                        }
                    }
                }
                OutlinedTextField(cash, { cash = it }, label = { Text("Paid in cash (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(due, { due = it }, label = { Text("Left as due (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val sacks = quantitySack.toDoubleOrNull() ?: 0.0
                val extraKg = quantityKgExtra.toDoubleOrNull() ?: 0.0
                val totalKg = sacks * product.kgPerSack + extraKg
                val price = unitPrice.toDoubleOrNull() ?: 0.0
                val cashAmt = cash.toDoubleOrNull() ?: 0.0
                val dueAmt = due.toDoubleOrNull() ?: 0.0
                if (totalKg <= 0) return@TextButton
                if (isSale) onSale(totalKg, price, cashAmt, dueAmt, selectedCustomer)
                else onPurchase(totalKg, price, cashAmt, dueAmt, selectedSupplier)
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
