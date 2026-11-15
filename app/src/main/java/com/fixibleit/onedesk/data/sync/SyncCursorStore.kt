package com.fixibleit.onedesk.data.sync

import android.content.Context
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

private val Context.syncCursorDataStore by preferencesDataStore(name = "sync_cursors")

/** Per-collection "last pulled" watermark, so a fresh app launch resumes exactly where
 * the live Firestore listeners left off instead of re-downloading the whole business history. */
@Singleton
class SyncCursorStore @Inject constructor(@ApplicationContext private val context: Context) {

    suspend fun get(entityType: String): Long {
        val prefs = context.syncCursorDataStore.data.first()
        return prefs[longPreferencesKey(entityType)] ?: 0L
    }

    suspend fun set(entityType: String, value: Long) {
        context.syncCursorDataStore.edit { it[longPreferencesKey(entityType)] = value }
    }
}
