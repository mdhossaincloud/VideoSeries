# Architecture Notes

## Layering

```
UI (Compose) → ViewModel (Hilt) → Repository → DAO (Room) ─┐
                                             ↓            │
                                     SyncEnqueuer         │
                                             ↓            │
                                     SyncQueueDao ───→ SyncWorker ──→ FirestoreSyncDataSource
                                                                              ↑
                                                       PullSyncManager (live listeners) ──→ RemoteChangeApplier → DAOs
```

- **Room is the single source of truth for the UI.** Every Flow the screens observe comes from a DAO. Firestore is a side channel for durability and cross-device replication.
- **Every write is append-only.** Reversals are new rows with `reversalOfId` set; the original is flagged `isReversed = true` and both live on in history and in the audit log.
- **Every ledger metric is a `SUM()` with a timestamp cutoff.** "Opening" and "current" are the same query, different cutoff. See `DashboardRepository.observeSnapshot`.

## Offline-first lifecycle of one write

1. User taps **Save** on, say, a rice sale.
2. `RiceRepository.recordSale`:
   - Inserts the `RiceStockMovementEntity` locally.
   - Posts a signed `CashLedgerEntity` for the cash portion (if any).
   - If part of the amount is on credit, calls `CustomerRepository.recordSaleOnCredit`, which inserts a `CustomerTransactionEntity`.
3. Each of those inserts also calls `SyncEnqueuer.enqueue`, which writes one row to `sync_queue` and nudges WorkManager.
4. UI flows re-emit immediately — the dashboard, stock, cash and customer due all tick up locally.
5. `SyncWorker` runs when the device has network. It drains `sync_queue` (batch of 25 at a time), pushing each payload to Firestore. Successful rows flip to `SYNCED` and are pruned after 7 days; failures record the error, bump the attempt count, and are retried with WorkManager's exponential backoff.
6. Other signed-in devices' live Firestore listeners pick up the new document; `PullSyncManager` persists its cursor and `RemoteChangeApplier` upserts into Room there, triggering its own UI flows.

Nothing in that chain requires a network connection for step 1-4. If the device is offline, steps 5-6 just wait.

## Why no local-UID balance cache?

An earlier variant kept per-customer `currentDue` on `CustomerEntity`, mutated at write time. That's a shadow value that will drift the moment a sync merges a correction from another device. The current design keeps balance derivation to a single SQL query, and `balanceAfter` on each transaction is a **snapshot for display only** (never trusted by totals). Reports therefore cannot be out of step with history, by construction.

## WorkManager + Hilt plumbing

- `OneDeskApplication` implements `Configuration.Provider` to let Hilt supply a `HiltWorkerFactory`.
- `SyncWorker` is `@HiltWorker`, so it participates in DI and gets `SyncQueueDao` and `FirestoreSyncDataSource` for free.
- The periodic request is `UNIQUE_PERIODIC_NAME` with `ExistingPeriodicWorkPolicy.KEEP` so repeated schedule calls don't create duplicates.
- The one-off nudge after every write is `UNIQUE_ONE_TIME_NAME` with `ExistingWorkPolicy.KEEP` — if a sync is already queued/running, we don't pile more up; the already-queued one will see the new rows in its batch.

## Firestore collection shape

See `FirestoreSchema.kt` and `firestore.rules`. All business data is scoped under `/businesses/{businessId}/...`, so this same schema can host multiple shops by swapping `DEFAULT_BUSINESS_ID`.

## Role gating

`RolePermissions` is the one place that decides what a role can do. UI screens call `canXxx(user.role)` to decide whether to show an action; repositories don't re-check, because an action that reaches a repository was already permitted by the UI. For hard safety (a jailbroken staff account) the Firestore rules restrict destructive paths (`audit_log` write) to owners.
