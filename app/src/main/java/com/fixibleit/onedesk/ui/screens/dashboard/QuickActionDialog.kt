@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.fixibleit.onedesk.ui.screens.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.fixibleit.onedesk.data.local.dao.CylinderTypeInventory
import com.fixibleit.onedesk.data.local.dao.RiceProductStock
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.util.Money

@Composable
fun QuickActionDialog(
    action: QuickAction,
    options: DashboardOptions,
    onDismiss: () -> Unit,
    onSellRice: (RiceProductStock, Double, Double, Double, Double, CustomerEntity?) -> Unit,
    onSellCylinder: (CylinderTypeInventory, Int, Double, Double, Double, CustomerEntity?, Boolean, Double) -> Unit,
    onExpense: (String, Double, String) -> Unit,
    onReceivePayment: (CustomerEntity, Double, String) -> Unit
) {
    when (action) {
        QuickAction.SELL_RICE -> SellRiceDialog(options, onDismiss, onSellRice)
        QuickAction.SELL_CYLINDER -> SellCylinderDialog(options, onDismiss, onSellCylinder)
        QuickAction.EXPENSE -> ExpenseDialog(options.expenseCategories, onDismiss, onExpense)
        QuickAction.RECEIVE_PAYMENT -> ReceivePaymentDialog(options.customers, onDismiss, onReceivePayment)
    }
}

@Composable
private fun SellRiceDialog(
    options: DashboardOptions,
    onDismiss: () -> Unit,
    onConfirm: (RiceProductStock, Double, Double, Double, Double, CustomerEntity?) -> Unit
) {
    if (options.riceProducts.isEmpty()) {
        EmptyGuardDialog("No rice products yet", "Add rice products from the Rice tab first.", onDismiss)
        return
    }
    var product by remember { mutableStateOf(options.riceProducts.first()) }
    var productExpanded by remember { mutableStateOf(false) }
    var sacks by remember { mutableStateOf("") }
    var extraKg by remember { mutableStateOf("") }
    var price by remember { mutableStateOf(product.sellingPricePerKgBDT.toString()) }
    var cash by remember { mutableStateOf("") }
    var due by remember { mutableStateOf("0") }
    var customer by remember { mutableStateOf<CustomerEntity?>(null) }
    var customerExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(product) { price = product.sellingPricePerKgBDT.toString() }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("চাল বিক্রি — Sell Rice") },
        text = {
            Column {
                PickerField("Product", "${product.name} (${Money.formatKg(product.currentStockKg)} in stock)", productExpanded, { productExpanded = it }) {
                    options.riceProducts.forEach { p ->
                        DropdownMenuItem(text = { Text("${p.name} (${Money.formatKg(p.currentStockKg)})") }, onClick = { product = p; productExpanded = false })
                    }
                }
                Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(sacks, { sacks = it }, label = { Text("Sacks") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(extraKg, { extraKg = it }, label = { Text("+ extra kg") }, modifier = Modifier.weight(1f))
                }
                Text("1 sack = ${Money.formatKg(product.kgPerSack)}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(price, { price = it }, label = { Text("Price per kg (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                CustomerField(customer, options.customers, customerExpanded, { customerExpanded = it }, { customer = it })
                OutlinedTextField(cash, { cash = it }, label = { Text("Paid cash (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(due, { due = it }, label = { Text("Left as due (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val qtyKg = (sacks.toDoubleOrNull() ?: 0.0) * product.kgPerSack + (extraKg.toDoubleOrNull() ?: 0.0)
                val p = price.toDoubleOrNull() ?: 0.0
                val c = cash.toDoubleOrNull() ?: 0.0
                val d = due.toDoubleOrNull() ?: 0.0
                if (qtyKg > 0 && p > 0 && (c + d > 0)) onConfirm(product, qtyKg, p, c, d, customer)
            }) { Text("Save Sale") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun SellCylinderDialog(
    options: DashboardOptions,
    onDismiss: () -> Unit,
    onConfirm: (CylinderTypeInventory, Int, Double, Double, Double, CustomerEntity?, Boolean, Double) -> Unit
) {
    if (options.cylinderTypes.isEmpty()) {
        EmptyGuardDialog("No cylinder types yet", "Add cylinder types from the Gas tab first.", onDismiss)
        return
    }
    var type by remember { mutableStateOf(options.cylinderTypes.first()) }
    var typeExpanded by remember { mutableStateOf(false) }
    var qty by remember { mutableStateOf("1") }
    var price by remember { mutableStateOf("") }
    var deposit by remember { mutableStateOf("") }
    var cash by remember { mutableStateOf("") }
    var due by remember { mutableStateOf("0") }
    var customer by remember { mutableStateOf<CustomerEntity?>(null) }
    var customerExpanded by remember { mutableStateOf(false) }
    var mode by remember { mutableStateOf(true) } // true = exchange (default), false = new with deposit

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("গ্যাস বিক্রি — Sell Cylinder") },
        text = {
            Column {
                PickerField("Cylinder", "${type.brand} ${type.sizeLabel} (${type.fullCount} full)", typeExpanded, { typeExpanded = it }) {
                    options.cylinderTypes.forEach { t ->
                        DropdownMenuItem(text = { Text("${t.brand} ${t.sizeLabel} (${t.fullCount} full)") }, onClick = { type = t; typeExpanded = false })
                    }
                }
                Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = { mode = true }, label = { Text("Exchange (empty for full)") },
                        colors = if (mode) AssistChipDefaults.assistChipColors(containerColor = MaterialTheme.colorScheme.primaryContainer) else AssistChipDefaults.assistChipColors())
                    AssistChip(onClick = { mode = false }, label = { Text("New + deposit") },
                        colors = if (!mode) AssistChipDefaults.assistChipColors(containerColor = MaterialTheme.colorScheme.primaryContainer) else AssistChipDefaults.assistChipColors())
                }
                Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(qty, { qty = it }, label = { Text("Qty") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(price, { price = it }, label = { Text("Price each") }, modifier = Modifier.weight(1f))
                }
                if (!mode) {
                    OutlinedTextField(deposit, { deposit = it }, label = { Text("Deposit per cylinder") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                }
                CustomerField(customer, options.customers, customerExpanded, { customerExpanded = it }, { customer = it })
                if (!mode && customer == null) {
                    Text("A new-with-deposit sale needs a named customer (so you can track who holds the cylinder).", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 4.dp))
                }
                OutlinedTextField(cash, { cash = it }, label = { Text("Paid cash (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(due, { due = it }, label = { Text("Left as due (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val q = qty.toIntOrNull() ?: 0
                val p = price.toDoubleOrNull() ?: 0.0
                val c = cash.toDoubleOrNull() ?: 0.0
                val d = due.toDoubleOrNull() ?: 0.0
                val dep = deposit.toDoubleOrNull() ?: 0.0
                if (q <= 0 || p <= 0) return@TextButton
                if (!mode && customer == null) return@TextButton
                onConfirm(type, q, p, c, d, customer, mode, dep)
            }) { Text("Save Sale") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun ExpenseDialog(categories: List<ExpenseCategoryEntity>, onDismiss: () -> Unit, onConfirm: (String, Double, String) -> Unit) {
    if (categories.isEmpty()) {
        EmptyGuardDialog("No expense categories", "Default categories will appear after first launch — reopen the app.", onDismiss); return
    }
    var cat by remember { mutableStateOf(categories.first()) }
    var catExpanded by remember { mutableStateOf(false) }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("খরচ লিখুন — Record Expense") },
        text = {
            Column {
                PickerField("Category", "${cat.nameBn} / ${cat.nameEn}", catExpanded, { catExpanded = it }) {
                    categories.forEach { c ->
                        DropdownMenuItem(text = { Text("${c.nameBn} / ${c.nameEn}") }, onClick = { cat = c; catExpanded = false })
                    }
                }
                OutlinedTextField(amount, { amount = it }, label = { Text("Amount (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(note, { note = it }, label = { Text("Note") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val a = amount.toDoubleOrNull() ?: 0.0
                if (a > 0) onConfirm(cat.id, a, note)
            }) { Text("Save Expense") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun ReceivePaymentDialog(customers: List<CustomerEntity>, onDismiss: () -> Unit, onConfirm: (CustomerEntity, Double, String) -> Unit) {
    if (customers.isEmpty()) {
        EmptyGuardDialog("No customers yet", "Register a customer from the Accounts tab first.", onDismiss); return
    }
    var customer by remember { mutableStateOf(customers.first()) }
    var customerExpanded by remember { mutableStateOf(false) }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("পেমেন্ট নিন — Receive Payment") },
        text = {
            Column {
                PickerField("Customer", customer.name, customerExpanded, { customerExpanded = it }) {
                    customers.forEach { c ->
                        DropdownMenuItem(text = { Text(c.name) }, onClick = { customer = c; customerExpanded = false })
                    }
                }
                OutlinedTextField(amount, { amount = it }, label = { Text("Amount (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(note, { note = it }, label = { Text("Note") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val a = amount.toDoubleOrNull() ?: 0.0
                if (a > 0) onConfirm(customer, a, note)
            }) { Text("Save Payment") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun PickerField(
    label: String,
    display: String,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    items: @Composable () -> Unit
) {
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = onExpandedChange) {
        OutlinedTextField(
            value = display, onValueChange = {}, readOnly = true, label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { onExpandedChange(false) }) {
            items()
        }
    }
}

@Composable
private fun CustomerField(
    selected: CustomerEntity?,
    customers: List<CustomerEntity>,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    onSelect: (CustomerEntity?) -> Unit
) {
    Spacer(Modifier.height(8.dp))
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = onExpandedChange) {
        OutlinedTextField(
            value = selected?.name ?: "Walk-in (cash sale)", onValueChange = {}, readOnly = true,
            label = { Text("Customer (optional)") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { onExpandedChange(false) }) {
            DropdownMenuItem(text = { Text("Walk-in (cash sale)") }, onClick = { onSelect(null); onExpandedChange(false) })
            customers.forEach { c ->
                DropdownMenuItem(text = { Text(c.name) }, onClick = { onSelect(c); onExpandedChange(false) })
            }
        }
    }
}

@Composable
private fun EmptyGuardDialog(title: String, body: String, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(body) },
        confirmButton = { TextButton(onClick = onDismiss) { Text("OK") } }
    )
}
