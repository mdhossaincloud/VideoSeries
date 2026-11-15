package com.fixibleit.onedesk.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.settingsDataStore by preferencesDataStore(name = "onedesk_settings")

/** The app opens in light mode by default; dark mode is only ever an explicit choice made here,
 * never derived from the system theme. */
@Singleton
class SettingsRepository @Inject constructor(@ApplicationContext private val context: Context) {

    private val darkModeKey = booleanPreferencesKey("dark_mode_enabled")
    private val sessionUserIdKey = stringPreferencesKey("session_user_id")

    val isDarkMode: Flow<Boolean> = context.settingsDataStore.data.map { it[darkModeKey] ?: false }

    suspend fun setDarkMode(enabled: Boolean) {
        context.settingsDataStore.edit { it[darkModeKey] = enabled }
    }

    val sessionUserId: Flow<String?> = context.settingsDataStore.data.map { it[sessionUserIdKey] }

    suspend fun setSessionUserId(userId: String?) {
        context.settingsDataStore.edit {
            if (userId == null) it.remove(sessionUserIdKey) else it[sessionUserIdKey] = userId
        }
    }
}
