package com.fixibleit.onedesk.ui.screens.settings

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fixibleit.onedesk.ui.common.SyncStatusBadge

@Composable
fun SettingsScreen(viewModel: SettingsViewModel = hiltViewModel(), onManageUsers: () -> Unit, onSignedOut: () -> Unit) {
    val state by viewModel.uiState.collectAsState()

    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/octet-stream")) { uri ->
        uri?.let { viewModel.exportBackup(it) }
    }
    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let { viewModel.stageRestore(it) }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Text("Settings", style = MaterialTheme.typography.headlineMedium)

        SettingsCard("Account") {
            Text(state.currentUser?.name ?: "", style = MaterialTheme.typography.titleSmall)
            Text(state.currentUser?.email ?: "", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(state.currentUser?.role?.name ?: "", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            TextButton(onClick = { viewModel.signOut(); onSignedOut() }, modifier = Modifier.padding(top = 8.dp)) { Text("Sign Out") }
        }

        SettingsCard("Appearance") {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Dark Mode", style = MaterialTheme.typography.bodyLarge)
                Switch(checked = state.isDarkTheme, onCheckedChange = { viewModel.setDarkMode(it) })
            }
        }

        SettingsCard("Sync") {
            SyncStatusBadge(state.pendingSyncCount, state.failedSyncCount)
            Text(
                "Every entry is saved locally first and synced to the cloud automatically once a connection is available.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        if (state.canManageUsers) {
            SettingsCard("Users") {
                Text("${state.users.size} of 4 users", style = MaterialTheme.typography.bodyMedium)
                TextButton(onClick = onManageUsers, modifier = Modifier.padding(top = 4.dp)) { Text("Manage Users") }
            }
        }

        if (state.canManageSync) {
            SettingsCard("Backup & Restore") {
                Text(
                    "Backup saves the entire local database to a file you choose. Restore replaces local data with a chosen backup file – the app must be closed and reopened afterwards to finish.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(onClick = { exportLauncher.launch("onedesk_backup_${System.currentTimeMillis()}.db") }, modifier = Modifier.weight(1f)) {
                        Text("Backup Now")
                    }
                    OutlinedButton(onClick = { importLauncher.launch(arrayOf("*/*")) }, modifier = Modifier.weight(1f)) {
                        Text("Restore")
                    }
                }
                if (state.restoreStaged) {
                    Text(
                        "Restore staged – please close and reopen the app now.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
                state.backupMessage?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp))
                }
            }
        }

        Text(
            "OneDesk Business V2 – Dubai Gas & Rice",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.outline,
            modifier = Modifier.padding(top = 24.dp, bottom = 24.dp)
        )
    }
}

@Composable
private fun SettingsCard(title: String, content: @Composable () -> Unit) {
    Card(Modifier.fillMaxWidth().padding(top = 16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 8.dp))
            content()
        }
    }
}
