package com.fixibleit.onedesk.ui.screens.settings

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
            item { SectionHeader("Users (${state.users.size}/$MAX_USERS_PER_BUSINESS)") }
            items(state.users, key = { it.id }) { user ->
                Card(Modifier.fillMaxWidth().padding(bottom = 10.dp)) {
                    Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(user.name, style = MaterialTheme.typography.titleSmall)
                            Text(user.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                            AssistChip(onClick = {}, label = { Text(user.role.name) })
                            if (user.id != state.currentUser?.id) {
                                TextButton(onClick = { viewModel.deactivateUser(user) }) { Text("Remove") }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAdd) {
        AddUserDialog(onDismiss = { showAdd = false }, onConfirm = { name, mobile, email, password, role ->
            viewModel.createUser(name, mobile, email, password, role); showAdd = false
        })
    }
}

@Composable
private fun AddUserDialog(onDismiss: () -> Unit, onConfirm: (String, String, String, String, UserRole) -> Unit) {
    var name by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf(UserRole.STAFF) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add User") },
        text = {
            Column {
                OutlinedTextField(name, { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(mobile, { mobile = it }, label = { Text("Mobile") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                OutlinedTextField(password, { password = it }, label = { Text("Temporary password") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = { role = UserRole.STAFF }, label = { Text("Staff") })
                    AssistChip(onClick = { role = UserRole.OWNER }, label = { Text("Owner") })
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                if (name.isNotBlank() && email.isNotBlank() && password.length >= 6) onConfirm(name, mobile, email, password, role)
            }) { Text("Create") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
