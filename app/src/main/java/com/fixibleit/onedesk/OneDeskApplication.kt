package com.fixibleit.onedesk

import android.app.Application
import android.content.Context
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.fixibleit.onedesk.data.local.AppDatabase
import com.fixibleit.onedesk.data.sync.PullSyncManager
import com.fixibleit.onedesk.data.sync.SyncScheduler
import com.fixibleit.onedesk.util.RestoreStaging
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import javax.inject.Inject

@HiltAndroidApp
class OneDeskApplication : Application(), Configuration.Provider {

    @Inject lateinit var workerFactory: HiltWorkerFactory
    @Inject lateinit var syncScheduler: SyncScheduler
    @Inject lateinit var pullSyncManager: PullSyncManager

    /** Lives for the process lifetime: the whole point of the always-on Firestore listeners
     * that keep other devices' changes flowing in even while no screen is on sync's behalf. */
    private val appScope = CoroutineScope(SupervisorJob())

    override fun attachBaseContext(base: Context) {
        // Must run before Hilt builds its component graph (which would open the live
        // database on first DAO access) - see RestoreStaging's kdoc for why.
        RestoreStaging.applyPendingRestoreIfAny(base, base.getDatabasePath(AppDatabase.DATABASE_NAME).absolutePath)
        super.attachBaseContext(base)
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()
        syncScheduler.schedulePeriodic()
        pullSyncManager.start(appScope)
    }
}
