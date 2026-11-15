package com.fixibleit.onedesk.data.repository

import android.content.Context
import android.net.Uri
import androidx.sqlite.db.SimpleSQLiteQuery
import com.fixibleit.onedesk.data.local.AppDatabase
import com.fixibleit.onedesk.util.RestoreStaging
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Whole-database file backup/restore (spec section 12: "Backup and restore instructions").
 * Export is safe to do live: it flushes WAL into the main file first, then copies it.
 * Restore cannot safely touch the live, already-open database file, so it stages the
 * chosen file and applies it on the next cold start - see RestoreStaging.
 */
@Singleton
class BackupRestoreManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val database: AppDatabase
) {
    suspend fun exportTo(destination: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching<Unit> {
            database.openHelper.writableDatabase.query(SimpleSQLiteQuery("PRAGMA wal_checkpoint(FULL)")).close()
            val dbFile = context.getDatabasePath(AppDatabase.DATABASE_NAME)
            val out = context.contentResolver.openOutputStream(destination)
                ?: error("Could not open the chosen file for writing")
            out.use { dbFile.inputStream().use { input -> input.copyTo(it) } }
        }
    }

    /** Stages the file; the actual swap happens on the next app launch (see
     * OneDeskApplication.attachBaseContext). Returns once staging is done so the caller can
     * tell the user to restart the app now. */
    suspend fun stageRestoreFrom(source: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching<Unit> {
            val stagingFile = File(RestoreStaging.stagingDir(context), "staged_${System.currentTimeMillis()}.db")
            val input = context.contentResolver.openInputStream(source)
                ?: error("Could not open the chosen backup file")
            input.use { stagingFile.outputStream().use { out -> it.copyTo(out) } }
            RestoreStaging.markPending(context, stagingFile.absolutePath)
        }
    }
}
