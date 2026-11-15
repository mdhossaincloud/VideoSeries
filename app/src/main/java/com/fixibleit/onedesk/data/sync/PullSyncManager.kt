package com.fixibleit.onedesk.data.sync

import com.fixibleit.onedesk.data.remote.FirestoreSyncDataSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Keeps this device's Room cache in step with every other authorized device: one live
 * Firestore listener per collection, each resuming from its own persisted cursor so a
 * cold start doesn't re-download the whole business history.
 */
@Singleton
class PullSyncManager @Inject constructor(
    private val remote: FirestoreSyncDataSource,
    private val cursorStore: SyncCursorStore,
    private val applier: RemoteChangeApplier
) {
    // (entityType, the field that marks "last touched", used both as the cursor and the query filter)
    private val watchedCollections = listOf(
        "User" to "updatedAt",
        "Customer" to "updatedAt",
        "CustomerTransaction" to "createdAt",
        "Supplier" to "updatedAt",
        "SupplierTransaction" to "createdAt",
        "RiceProduct" to "updatedAt",
        "RiceStockMovement" to "createdAt",
        "CylinderType" to "updatedAt",
        "CylinderTransaction" to "createdAt",
        "ExpenseCategory" to "updatedAt",
        "Expense" to "createdAt",
        "CashLedgerEntry" to "createdAt"
    )

    fun start(scope: CoroutineScope) {
        watchedCollections.forEach { (entityType, timestampField) ->
            resumableChanges(entityType, timestampField)
                .onEach { changes ->
                    var maxTs = 0L
                    changes.forEach { change ->
                        applier.apply(change)
                        val ts = (change.data[timestampField] as? Number)?.toLong() ?: 0L
                        if (ts > maxTs) maxTs = ts
                    }
                    if (maxTs > 0L) cursorStore.set(entityType, maxTs)
                }
                .launchIn(scope)
        }
    }

    /** Reads the persisted cursor once, then opens the live listener from that point forward. */
    private fun resumableChanges(entityType: String, timestampField: String) = flow {
        val since = cursorStore.get(entityType)
        emitAll(remote.observeRemoteChanges(entityType, timestampField, since))
    }
}
