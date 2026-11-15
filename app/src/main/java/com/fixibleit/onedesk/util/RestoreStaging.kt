package com.fixibleit.onedesk.util

import android.content.Context
import java.io.File

/**
 * Deliberately plain SharedPreferences, not DataStore: this must be readable synchronously,
 * with zero DI or coroutines, from Application.attachBaseContext() - before Hilt (and
 * therefore Room) has opened the live database file. That is the only safe moment to swap
 * a restored backup into place; doing it while the database is open would silently corrupt it.
 */
object RestoreStaging {
    private const val PREFS = "onedesk_restore_staging"
    private const val KEY_PENDING_PATH = "pending_restore_path"

    fun markPending(context: Context, stagedFilePath: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_PENDING_PATH, stagedFilePath).apply()
    }

    fun stagingDir(context: Context): File = File(context.filesDir, "restore_staging").apply { mkdirs() }

    /** Called once, at the very start of Application.attachBaseContext(). If a restore is
     * pending, copies the staged file over the live database (and clears any stale WAL/SHM
     * journals so SQLite doesn't try to replay against the old data) before anything else runs. */
    fun applyPendingRestoreIfAny(context: Context, liveDatabasePath: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val pendingPath = prefs.getString(KEY_PENDING_PATH, null) ?: return
        val staged = File(pendingPath)
        if (staged.exists()) {
            val liveFile = File(liveDatabasePath)
            liveFile.parentFile?.mkdirs()
            staged.copyTo(liveFile, overwrite = true)
            File("$liveDatabasePath-wal").delete()
            File("$liveDatabasePath-shm").delete()
            staged.delete()
        }
        prefs.edit().remove(KEY_PENDING_PATH).apply()
    }
}
