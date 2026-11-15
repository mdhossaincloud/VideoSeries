@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.fixibleit.onedesk.ui.screens.expense

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
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
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
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.ui.common.EmptyState
import com.fixibleit.onedesk.ui.common.MoneyStatCard
import com.fixibleit.onedesk.ui.common.SectionHeader
import com.fixibleit.onedesk.ui.theme.DangerRed
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.Money

@Composable
fun ExpenseScreen(viewModel: ExpenseViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    var showRecord by remember { mutableStateOf(false) }
    var showAddCategory by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showRecord = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Record expense")
            }
        }
    ) { padding ->
        val contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = padding.calculateTopPadding() + 16.dp, bottom = 88.dp)
        LazyColumn(contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { SectionHeader("দোকান খরচ (Shop Expenses)") }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = state.period == ExpensePeriod.DAY, onClick = { viewModel.setPeriod(ExpensePeriod.DAY) }, label = { Text("Daily") })
                    FilterChip(selected = state.period == ExpensePeriod.WEEK, onClick = { viewModel.setPeriod(ExpensePeriod.WEEK) }, label = { Text("Weekly") })
                    FilterChip(selected = state.period == ExpensePeriod.MONTH, onClick = { viewModel.setPeriod(ExpensePeriod.MONTH) }, label = { Text("Monthly") })
                }
            }
            item { MoneyStatCard("Total", state.totalBDT, Modifier.fillMaxWidth(), DangerRed) }

            item { SectionHeader("By Category") {
                TextButton(onClick = { showAddCategory = true }) { Text("+ Category") }
            } }
            items(state.totalsByCategory.filter { it.totalBDT > 0 }, key = { it.categoryId }) { cat ->
                Card(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${cat.categoryNameBn} / ${cat.categoryNameEn}", style = MaterialTheme.typography.bodyMedium)
                        Text(Money.format(cat.totalBDT), style = MaterialTheme.typography.titleSmall)
                    }
                }
            }

            item { SectionHeader("Recent Entries") }
            if (state.expenses.isEmpty()) {
                item { EmptyState("No expenses recorded for this period.") }
            }
            items(state.expenses, key = { it.id }) { e ->
                Card(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(e.categoryNameBn, style = MaterialTheme.typography.titleSmall)
                            Text(e.note.ifBlank { DateUtil.formatDateTime(e.createdAt) }, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Text(Money.format(e.amountBDT), style = MaterialTheme.typography.titleSmall, color = DangerRed)
                    }
                }
            }
        }
    }

    if (showRecord) {
        RecordExpenseDialog(categories = state.categories, onDismiss = { showRecord = false }, onConfirm = { categoryId, amount, note ->
            viewModel.recordExpense(categoryId, amount, note); showRecord = false
        })
    }
    if (showAddCategory) {
        AddCategoryDialog(onDismiss = { showAddCategory = false }, onConfirm = { bn, en ->
            viewModel.addCategory(bn, en); showAddCategory = false
        })
    }
}

@Composable
private fun RecordExpenseDialog(categories: List<ExpenseCategoryEntity>, onDismiss: () -> Unit, onConfirm: (String, Double, String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf(categories.firstOrNull()) }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Record Expense") },
        text = {
            Column {
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
                    OutlinedTextField(
                        value = selected?.let { "${it.nameBn} / ${it.nameEn}" } ?: "Select category",
                        onValueChange = {}, readOnly = true,
                        label = { Text("Category") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        categories.forEach { c ->
                            DropdownMenuItem(text = { Text("${c.nameBn} / ${c.nameEn}") }, onClick = { selected = c; expanded = false })
                        }
                    }
                }
                OutlinedTextField(amount, { amount = it }, label = { Text("Amount (BDT)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(note, { note = it }, label = { Text("Note") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val amt = amount.toDoubleOrNull() ?: 0.0
                val cat = selected
                if (amt > 0 && cat != null) onConfirm(cat.id, amt, note)
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun AddCategoryDialog(onDismiss: () -> Unit, onConfirm: (String, String) -> Unit) {
    var nameBn by remember { mutableStateOf("") }
    var nameEn by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Expense Category") },
        text = {
            Column {
                OutlinedTextField(nameBn, { nameBn = it }, label = { Text("Name (বাংলা)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(nameEn, { nameEn = it }, label = { Text("Name (English)") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
        },
        confirmButton = { TextButton(onClick = { onConfirm(nameBn, nameEn) }) { Text("Save") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
