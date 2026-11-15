package com.fixibleit.onedesk.data.remote

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/** One remote document change, as a flat map, ready for EntityMappers.*FromMap(). */
data class RemoteChange(val entityType: String, val docId: String, val data: Map<String, Any?>, val isDelete: Boolean)

@Singleton
class FirestoreSyncDataSource @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    private val businessId: String = FirestoreSchema.DEFAULT_BUSINESS_ID

    private fun collection(entityType: String) = firestore
        .collection(FirestoreSchema.ROOT_COLLECTION)
        .document(businessId)
        .collection(FirestoreSchema.collectionFor(entityType))

    /** Idempotent by design: docId == the entity's own id, so a retried push after a
     * dropped connection just overwrites the same document with the same data. */
    suspend fun push(entityType: String, docId: String, data: Map<String, Any?>) {
        collection(entityType).document(docId).set(data).await()
    }

    /**
     * Live listener for one entity's collection, used to pull in changes made from other
     * devices. [sinceUpdatedAt] is the field name this entityType uses as its "last touched"
     * timestamp (updatedAt for mutable master data, createdAt for append-only ledger rows).
     */
    fun observeRemoteChanges(entityType: String, timestampField: String, sinceEpochMillis: Long): Flow<List<RemoteChange>> =
        callbackFlow {
            val query: Query = collection(entityType)
                .whereGreaterThan(timestampField, sinceEpochMillis)
                .orderBy(timestampField, Query.Direction.ASCENDING)

            val registration = query.addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) return@addSnapshotListener
                val changes = snapshot.documentChanges.mapNotNull { dc ->
                    // Ignore changes this device just wrote itself and is now hearing back from
                    // the server, since the local row is already authoritative for its own write.
                    if (dc.document.metadata.hasPendingWrites()) return@mapNotNull null
                    RemoteChange(
                        entityType = entityType,
                        docId = dc.document.id,
                        data = dc.document.data,
                        isDelete = dc.type == com.google.firebase.firestore.DocumentChange.Type.REMOVED
                    )
                }
                if (changes.isNotEmpty()) trySend(changes)
            }
            awaitClose { registration.remove() }
        }
}
