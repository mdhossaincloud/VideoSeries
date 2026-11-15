# Backup & Restore

The app always keeps the full business history in the cloud via Firestore (see `FIREBASE_SETUP.md`). On top of that, it supports **whole-database local backup files** for owners who want an air-gapped copy or who need to migrate to a new phone.

## Backup

1. Sign in as **Owner**.
2. Open **Settings → Backup & Restore → Backup Now**.
3. The system file picker opens. Choose a name (default: `onedesk_backup_<timestamp>.db`) and location — any Documents folder, Google Drive, or USB OTG works.
4. The app flushes the SQLite WAL and writes a complete snapshot of the local database to that file.

A backup file is a fully consistent snapshot: it contains every rice movement, cylinder transaction, customer and supplier ledger, cash ledger entry, expense, and audit log row as of the moment you exported it.

## Restore

> ⚠️ Restore replaces **all** local data with the chosen backup. The cloud copy is untouched, so if you only need to pull in another device's data, let Firestore sync do it automatically instead.

1. Sign in as **Owner**.
2. **Settings → Backup & Restore → Restore**.
3. Pick the previously exported `.db` file.
4. The app stages the file and displays **"Restore staged — please close and reopen the app now."**
5. Force-close the app and launch it again. On startup, the app swaps the staged file into place *before* the database is opened, and SQLite cleans up any WAL/SHM leftovers automatically.
6. Sign in again. The restored data is now live. The sync queue will reconcile any differences with Firestore in the background.

## Why a two-step restore?

A running app holds the SQLite database file open with active write-ahead-log journals. Overwriting that file in place would silently corrupt it. The app therefore writes the chosen backup into a staging area, marks a flag in plain SharedPreferences, and does the atomic swap on the next cold start, before Hilt and Room open the database — see `util/RestoreStaging.kt`.

## Automated / scheduled backups

Not shipped in V2. The app does not have background permission to write to arbitrary filesystem locations without the user picking one via the system file picker. Add a WorkManager job that writes to a scoped-storage folder if you need daily auto-backups.

## Cloud-side restore

Because Firestore is the long-term source of truth:
- If a device is lost, install OneDesk on a new phone, sign in with the same account, and every historical entry re-downloads automatically.
- The local `.db` file backup is for paranoia-level redundancy, not for the primary recovery path.
