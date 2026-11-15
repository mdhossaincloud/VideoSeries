package com.fixibleit.onedesk.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.entity.UserEntity
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.DataSeeder
import com.fixibleit.onedesk.data.repository.SettingsRepository
import com.fixibleit.onedesk.data.local.dao.SyncQueueDao
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SessionUiState(
    val isLoading: Boolean = true,
    val currentUser: UserEntity? = null,
    val isDarkTheme: Boolean = false,
    val pendingSyncCount: Int = 0,
    val failedSyncCount: Int = 0
)

@HiltViewModel
class SessionViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val settingsRepository: SettingsRepository,
    private val syncQueueDao: SyncQueueDao,
    private val dataSeeder: DataSeeder
) : ViewModel() {

    val uiState: StateFlow<SessionUiState> = combine(
        authRepository.currentUser,
        settingsRepository.isDarkMode,
        syncQueueDao.observePendingCount(),
        syncQueueDao.observeFailedCount()
    ) { user, darkMode, pending, failed ->
        SessionUiState(isLoading = false, currentUser = user, isDarkTheme = darkMode, pendingSyncCount = pending, failedSyncCount = failed)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, SessionUiState())

    init {
        viewModelScope.launch { dataSeeder.seedDefaultExpenseCategoriesIfEmpty() }
    }

    fun setDarkMode(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setDarkMode(enabled) }
    }

    fun signOut() {
        viewModelScope.launch { authRepository.signOut() }
    }
}
