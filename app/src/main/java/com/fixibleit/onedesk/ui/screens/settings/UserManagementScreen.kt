package com.fixibleit.onedesk.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
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
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fixibleit.onedesk.data.model.UserRole
import com.fixibleit.onedesk.data.repository.MAX_USERS_PER_BUSINESS
import com.fixibleit.onedesk.ui.common.SectionHeader

@Composable
fun UserManagementScreen(viewModel: SettingsViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    var showAdd by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            if (state.users.size < MAX_USERS_PER_BUSINESS) {
                FloatingActionButton(onClick = { showAdd = true }) { Icon(Icons.Filled.Add, contentDescription = "Add user") }
            }
        }
    ) { padding ->
        LazyColumn(contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = padding.calculateTopPadding() + 16.dp, bottom = 88.dp)) {
            if (state.pendingRequests.isNotEmpty()) {
                item { SectionHeader("Pending Requests (${state.pendingRequests.size})") }
                items(state.pendingRequests, key = { "pending-${it.id}" }) { req ->
                    Card(Modifier.fillMaxWidth().padding(bottom = 10.dp)) {
                        Column(Modifier.padding(14.dp)) {
                            Text(req.name.ifBlank { req.email.substringBefore("@") }, style = MaterialTheme.typography.titleSmall)
                            Text(req.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            if (req.mobile.isNotBlank()) {
                                Text(req.mobile, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.End) {
                                TextButton(onClick = { viewModel.declineRequest(req) }) { Text("Decline", maxLines = 1, softWrap = false) }
                                TextButton(onClick = { viewModel.approveRequest(req) }) { Text("Accept", maxLines = 1, softWrap = false) }
                            }
                        }
                    }
                }
            }
            item { SectionHeader("Users (${state.users.size}/$MAX_USERS_PER_BUSINESS)") }
            items(state.users, key = { it.id }) { user ->
                // Protect every OWNER from removal (the founding owner must never be
                // left locked out). Staff can always be removed. Users also can't
                // remove themselves from here.
                val isSelf = user.id == state.currentUser?.id
                val isProtectedOwner = user.role == com.fixibleit.onedesk.data.model.UserRole.OWNER
                Card(Modifier.fillMaxWidth().padding(bottom = 10.dp)) {
                    Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(user.name, style = MaterialTheme.typography.titleSmall)
                            Text(user.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                            AssistChip(onClick = {}, label = { Text(user.role.name, maxLines = 1, softWrap = false) })
                            if (!isSelf && !isProtectedOwner) {
                                TextButton(onClick = { viewModel.deactivateUser(user) }) { Text("Remove") }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAdd) {
        AddUserDialog(onDismiss = { showAdd = false }, onConfirm = { name, mobile, email, password ->
            // Admin-created accounts are always STAFF. The founding owner only exists
            // through the Login screen's Create Account flow and cannot be made here.
            viewModel.createUser(name, mobile, email, password, UserRole.STAFF)
            showAdd = false
        })
    }
}

@Composable
private fun AddUserDialog(onDismiss: () -> Unit, onConfirm: (String, String, String, String) -> Unit) {
    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    val valid = name.isNotBlank() && email.isNotBlank() && password.length >= 6
    val submit = { if (valid) onConfirm(name, mobile, email, password) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Staff User") },
        text = {
            Column {
                OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(mobile, { mobile = it }, label = { Text("Mobile") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(email, { email = it }, label = { Text("Email") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(password, { password = it }, label = { Text("Temporary password (min 6)") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { submit() }),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                Text(
                    "This account will have the STAFF role. Staff users cannot manage other users or reverse financial records.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 10.dp)
                )
            }
        },
        confirmButton = { TextButton(onClick = submit, enabled = valid) { Text("Create Staff") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
