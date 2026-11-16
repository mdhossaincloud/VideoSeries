@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.fixibleit.onedesk.ui.screens.gas

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
import com.fixibleit.onedesk.data.local.dao.CylinderTypeInventory
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.model.CylinderMaterial
import com.fixibleit.onedesk.ui.common.EmptyState
import com.fixibleit.onedesk.ui.common.SectionHeader
import com.fixibleit.onedesk.util.Money

@Composable
fun CylinderScreen(viewModel: CylinderViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    var showAddType by remember { mutableStateOf(false) }
    var actionTarget by remember { mutableStateOf<CylinderTypeInventory?>(null) }
    var editTarget by remember { mutableStateOf<CylinderTypeInventory?>(null) }
    var adjustTarget by remember { mutableStateOf<CylinderTypeInventory?>(null) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddType = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Add cylinder type")
            }
        }
    ) { padding ->
        val contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = padding.calculateTopPadding() + 16.dp, bottom = 88.dp)
        LazyColumn(contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { SectionHeader("গ্যাস ও সিলিন্ডার (Gas & Cylinder Inventory)") }

            if (state.inventory.isEmpty()) {
                item { EmptyState("No cylinder types yet. Tap + to add your first brand & size.") }
            }

            items(state.inventory, key = { it.id }) { inv ->
                CylinderTypeCard(
                    inv,
                    onAction = { actionTarget = inv },
                    onEdit = { editTarget = inv },
                    onAdjust = { adjustTarget = inv }
                )
            }

            item { SectionHeader("কাস্টমারের কাছে বোতল (Customer Holdings)") }
            if (state.holdings.isEmpty()) {
                item { EmptyState("No cylinders are currently held by customers.") }
            }
            items(state.holdings, key = { "${it.customerId}-${it.cylinderTypeId}" }) { h ->
                Card(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(h.customerName, style = MaterialTheme.typography.titleSmall)
                            Text("${h.brand} ${h.sizeLabel}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                            Text("${h.heldCount} pcs", style = MaterialTheme.typography.titleSmall)
                            Text(Money.format(h.depositHeldBDT), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }

    if (showAddType) {
        AddCylinderTypeDialog(existing = null, onDismiss = { showAddType = false }, onConfirm = { brand, size, material, pp, sp, dep ->
            viewModel.saveType(null, brand, size, material, pp, sp, dep)
            showAddType = false
        })
    }
    editTarget?.let { inv ->
        AddCylinderTypeDialog(existing = inv, onDismiss = { editTarget = null }, onConfirm = { brand, size, material, pp, sp, dep ->
            viewModel.saveType(inv.id, brand, size, material, pp, sp, dep)
            editTarget = null
        })
    }
    adjustTarget?.let { inv ->
        AdjustCylinderStockDialog(type = inv, onDismiss = { adjustTarget = null }, onConfirm = { full, empty, note ->
            viewModel.adjustCylinderStock(inv, full, empty, note); adjustTarget = null
        })
    }

    actionTarget?.let { inv ->
        CylinderActionDialog(
            inventory = inv,
            customers = state.customers,
            onDismiss = { actionTarget = null },
            onPurchaseRefill = { qty, unitCost, cash, due ->
                viewModel.recordPurchaseRefill(typeOf(inv), qty, unitCost, cash, due); actionTarget = null
            },
            onSaleExchange = { qty, price, cash, due, customer ->
                viewModel.recordSaleExchange(typeOf(inv), qty, price, cash, due, customer); actionTarget = null
            },
            onSaleNewWithDeposit = { qty, price, deposit, cash, due, customer ->
                viewModel.recordSaleNewWithDeposit(typeOf(inv), qty, price, deposit, cash, due, customer); actionTarget = null
            },
            onReturnEmpty = { qty, customer, refund ->
                viewModel.recordReturnEmpty(typeOf(inv), qty, customer, refund); actionTarget = null
            }
        )
    }
}

/** UI only receives the read-model (CylinderTypeInventory); actions need the full entity,
 * which for this screen's purposes only needs the id the DAO queries already carry. */
private fun typeOf(inv: CylinderTypeInventory) = com.fixibleit.onedesk.data.local.entity.CylinderTypeEntity(
    id = inv.id, brand = inv.brand, sizeLabel = inv.sizeLabel,
    material = CylinderMaterial.valueOf(inv.material), purchasePriceBDT = 0.0, sellingPriceBDT = 0.0,
    depositAmountBDT = 0.0, createdAt = 0L, updatedAt = 0L
)

@Composable
private fun CylinderTypeCard(inv: CylinderTypeInventory, onAction: () -> Unit, onEdit: () -> Unit, onAdjust: () -> Unit) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("${inv.brand} – ${inv.sizeLabel}", style = MaterialTheme.typography.titleMedium, maxLines = 1, softWrap = false)
                AssistChip(onClick = onAction, label = { Text("Record", maxLines = 1, softWrap = false) })
            }
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                InventoryStat("Full", "${inv.fullCount}")
                InventoryStat("Empty", "${inv.emptyCount}")
                InventoryStat("W/ cust.", "${inv.customerHeldCount}")
                InventoryStat("Deposit", Money.format(inv.depositLiabilityBDT))
            }
            Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.End) {
                androidx.compose.material3.TextButton(onClick = onAdjust) { Text("Adjust Stock", maxLines = 1, softWrap = false) }
                androidx.compose.material3.TextButton(onClick = onEdit) { Text("Edit", maxLines = 1, softWrap = false) }
            }
        }
    }
}

@Composable
private fun InventoryStat(label: String, value: String) {
    Column {
        Text(value, style = MaterialTheme.typography.titleSmall)
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun AddCylinderTypeDialog(
    existing: CylinderTypeInventory?,
    onDismiss: () -> Unit,
    onConfirm: (String, String, CylinderMaterial, Double, Double, Double) -> Unit
) {
    var brand by remember { mutableStateOf(existing?.brand.orEmpty()) }
    var size by remember { mutableStateOf(existing?.sizeLabel.orEmpty()) }
    var material by remember { mutableStateOf(existing?.material?.let { CylinderMaterial.valueOf(it) } ?: CylinderMaterial.IRON) }
    var purchasePrice by remember { mutableStateOf("") }
    var sellingPrice by remember { mutableStateOf("") }
    var deposit by remember { mutableStateOf("") }

    val save = {
        if (brand.isNotBlank() && size.isNotBlank()) {
            onConfirm(brand.trim(), size.trim(), material,
                purchasePrice.toDoubleOrNull() ?: 0.0,
                sellingPrice.toDoubleOrNull() ?: 0.0,
                deposit.toDoubleOrNull() ?: 0.0)
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (existing == null) "Add Cylinder Type" else "Edit Cylinder Type") },
        text = {
            Column {
                OutlinedTextField(brand, { brand = it }, label = { Text("Brand (e.g. Bashundhara)") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(imeAction = androidx.compose.ui.text.input.ImeAction.Next),
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(size, { size = it }, label = { Text("Size (e.g. 12kg)") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(imeAction = androidx.compose.ui.text.input.ImeAction.Next),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                MaterialDropdown(material, { material = it })
                OutlinedTextField(purchasePrice, { purchasePrice = it }, label = { Text("Purchase price (BDT)") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal, imeAction = androidx.compose.ui.text.input.ImeAction.Next),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(sellingPrice, { sellingPrice = it }, label = { Text("Selling price (BDT)") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal, imeAction = androidx.compose.ui.text.input.ImeAction.Next),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(deposit, { deposit = it }, label = { Text("Deposit per cylinder (BDT)") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal, imeAction = androidx.compose.ui.text.input.ImeAction.Done),
                    keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { save() }),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = { TextButton(onClick = save) { Text("Save") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun AdjustCylinderStockDialog(type: CylinderTypeInventory, onDismiss: () -> Unit, onConfirm: (Int, Int, String) -> Unit) {
    var newFull by remember { mutableStateOf(type.fullCount.toString()) }
    var newEmpty by remember { mutableStateOf(type.emptyCount.toString()) }
    var note by remember { mutableStateOf("") }

    val save = {
        val f = newFull.toIntOrNull() ?: 0
        val e = newEmpty.toIntOrNull() ?: 0
        if (f >= 0 && e >= 0) onConfirm(f, e, note)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Adjust Stock — ${type.brand} ${type.sizeLabel}") },
        text = {
            Column {
                Text("Current full: ${type.fullCount} • empty: ${type.emptyCount}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(newFull, { newFull = it }, label = { Text("New full count") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number, imeAction = androidx.compose.ui.text.input.ImeAction.Next),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(newEmpty, { newEmpty = it }, label = { Text("New empty count") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number, imeAction = androidx.compose.ui.text.input.ImeAction.Next),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(note, { note = it }, label = { Text("Reason (optional)") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(imeAction = androidx.compose.ui.text.input.ImeAction.Done),
                    keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { save() }),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = { TextButton(onClick = save) { Text("Save") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun MaterialDropdown(selected: CylinderMaterial, onSelected: (CylinderMaterial) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = Modifier.padding(top = 8.dp)) {
        OutlinedTextField(
            value = selected.name, onValueChange = {}, readOnly = true,
            label = { Text("Material") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            CylinderMaterial.entries.forEach {
                DropdownMenuItem(text = { Text(it.name) }, onClick = { onSelected(it); expanded = false })
            }
        }
    }
}

@Composable
private fun CylinderActionDialog(
    inventory: CylinderTypeInventory,
    customers: List<CustomerEntity>,
    onDismiss: () -> Unit,
    onPurchaseRefill: (Int, Double, Double, Double) -> Unit,
    onSaleExchange: (Int, Double, Double, Double, CustomerEntity?) -> Unit,
    onSaleNewWithDeposit: (Int, Double, Double, Double, Double, CustomerEntity) -> Unit,
    onReturnEmpty: (Int, CustomerEntity, Double) -> Unit
) {
    var mode by remember { mutableStateOf("refill") }
    var quantity by remember { mutableStateOf("1") }
    var price by remember { mutableStateOf("") }
    var deposit by remember { mutableStateOf("") }
    var cash by remember { mutableStateOf("") }
    var due by remember { mutableStateOf("0") }
    var customerExpanded by remember { mutableStateOf(false) }
    var selectedCustomer by remember { mutableStateOf<CustomerEntity?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("${inventory.brand} ${inventory.sizeLabel}") },
        text = {
            Column {
                // Two rows of two chips each so no label ever wraps.
                val modes = listOf(
                    "refill" to "Buy Refill",
                    "exchange" to "Exchange",
                    "new" to "New + Deposit",
                    "return" to "Return Empty"
                )
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    modes.chunked(2).forEach { pair ->
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            pair.forEach { (key, label) ->
                                val selected = mode == key
                                AssistChip(
                                    onClick = { mode = key },
                                    label = { Text(label, style = MaterialTheme.typography.labelSmall, maxLines = 1, softWrap = false) },
                                    colors = if (selected) androidx.compose.material3.AssistChipDefaults.assistChipColors(containerColor = MaterialTheme.colorScheme.primaryContainer) else androidx.compose.material3.AssistChipDefaults.assistChipColors(),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
                OutlinedTextField(quantity, { quantity = it }, label = { Text("Quantity") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                if (mode != "return") {
                    OutlinedTextField(price, { price = it }, label = { Text(if (mode == "refill") "Unit cost (BDT)" else "Unit price (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                }
                if (mode == "new") {
                    OutlinedTextField(deposit, { deposit = it }, label = { Text("Deposit per unit (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                }
                if (mode == "return") {
                    OutlinedTextField(deposit, { deposit = it }, label = { Text("Deposit to refund (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                }
                if (mode != "refill") {
                    ExposedDropdownMenuBox(expanded = customerExpanded, onExpandedChange = { customerExpanded = it }, modifier = Modifier.padding(top = 8.dp)) {
                        OutlinedTextField(
                            value = selectedCustomer?.name ?: "Walk-in (cash sale)", onValueChange = {}, readOnly = true,
                            label = { Text("Customer") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = customerExpanded) },
                            modifier = Modifier.fillMaxWidth().menuAnchor()
                        )
                        ExposedDropdownMenu(expanded = customerExpanded, onDismissRequest = { customerExpanded = false }) {
                            DropdownMenuItem(text = { Text("Walk-in (cash sale)") }, onClick = { selectedCustomer = null; customerExpanded = false })
                            customers.forEach { c ->
                                DropdownMenuItem(text = { Text(c.name) }, onClick = { selectedCustomer = c; customerExpanded = false })
                            }
                        }
                    }
                }
                if (mode != "return") {
                    OutlinedTextField(cash, { cash = it }, label = { Text("Paid in cash (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                    OutlinedTextField(due, { due = it }, label = { Text("Left as due (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val qty = quantity.toIntOrNull() ?: 0
                val unitPrice = price.toDoubleOrNull() ?: 0.0
                val cashAmt = cash.toDoubleOrNull() ?: 0.0
                val dueAmt = due.toDoubleOrNull() ?: 0.0
                val depositAmt = deposit.toDoubleOrNull() ?: 0.0
                if (qty <= 0) return@TextButton
                when (mode) {
                    "refill" -> onPurchaseRefill(qty, unitPrice, cashAmt, dueAmt)
                    "exchange" -> onSaleExchange(qty, unitPrice, cashAmt, dueAmt, selectedCustomer)
                    "new" -> selectedCustomer?.let { onSaleNewWithDeposit(qty, unitPrice, depositAmt, cashAmt, dueAmt, it) }
                    "return" -> selectedCustomer?.let { onReturnEmpty(qty, it, depositAmt) }
                }
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
