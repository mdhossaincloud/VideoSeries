package com.fixibleit.onedesk.ui.screens.settings

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.dao.SyncQueueDao
import com.fixibleit.onedesk.data.local.entity.UserEntity
import com.fixibleit.onedesk.data.model.UserRole
import com.fixibleit.onedesk.data.repository.AuthOutcome
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.BackupRestoreManager
import com.fixibleit.onedesk.data.repository.SettingsRepository
import com.fixibleit.onedesk.domain.model.RolePermissions
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val currentUser: UserEntity? = null,
    val isDarkTheme: Boolean = false,
    val pendingSyncCount: Int = 0,
    val failedSyncCount: Int = 0,
    val users: List<UserEntity> = emptyList(),
    val canManageUsers: Boolean = false,
    val canManageSync: Boolean = false,
    val backupMessage: String? = null,
    val restoreStaged: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val settingsRepository: SettingsRepository,
    private val syncQueueDao: SyncQueueDao,
    private val backupRestoreManager: BackupRestoreManager
) : ViewModel() {

    private val _backupMessage = MutableStateFlow<String?>(null)
    private val _restoreStaged = MutableStateFlow(false)

    val uiState: StateFlow<SettingsUiState> = combine(
        authRepository.currentUser,
        settingsRepository.isDarkMode,
        syncQueueDao.observePendingCount(),
        syncQueueDao.observeFailedCount(),
        authRepository.observeActiveUsers()
    ) { user, dark, pending, failed, users ->
        SettingsUiState(
            currentUser = user, isDarkTheme = dark, pendingSyncCount = pending, failedSyncCount = failed,
            users = users, canManageUsers = user?.let { RolePermissions.canManageUsers(it.role) } ?: false,
            canManageSync = user?.let { RolePermissions.canManageSyncAndBackup(it.role) } ?: false
        )
    }.combine(_backupMessage) { s, msg -> s.copy(backupMessage = msg) }
        .combine(_restoreStaged) { s, staged -> s.copy(restoreStaged = staged) }
        .stateIn(viewModelScope, SharingStarted.Eagerly, SettingsUiState())

    fun setDarkMode(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setDarkMode(enabled) }
    }

    fun signOut() {
        viewModelScope.launch { authRepository.signOut() }
    }

    fun createUser(name: String, mobile: String, email: String, password: String, role: UserRole) {
        viewModelScope.launch {
            val performedBy = authRepository.currentUserIdOrNull() ?: return@launch
            when (val outcome = authRepository.createStaffOrOwnerAccount(name, mobile, email, password, role, performedBy)) {
                is AuthOutcome.Success -> _backupMessage.value = "User created"
                is AuthOutcome.Error -> _backupMessage.value = outcome.message
            }
        }
    }

    fun deactivateUser(user: UserEntity) {
        viewModelScope.launch {
            val performedBy = authRepository.currentUserIdOrNull() ?: return@launch
            authRepository.deactivateUser(user, performedBy)
        }
    }

    fun exportBackup(destination: Uri) {
        viewModelScope.launch {
            val result = backupRestoreManager.exportTo(destination)
            _backupMessage.value = if (result.isSuccess) "Backup saved successfully." else "Backup failed: ${result.exceptionOrNull()?.message}"
        }
    }

    fun stageRestore(source: Uri) {
        viewModelScope.launch {
            val result = backupRestoreManager.stageRestoreFrom(source)
            if (result.isSuccess) {
                _restoreStaged.value = true
                _backupMessage.value = "Backup staged. Close and reopen the app to finish restoring."
            } else {
                _backupMessage.value = "Restore failed: ${result.exceptionOrNull()?.message}"
            }
        }
    }

    fun clearMessage() { _backupMessage.value = null }
}
