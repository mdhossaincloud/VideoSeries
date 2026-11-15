# OneDesk Business V2

Premium offline-first Android business management application for **Dubai Gas & Rice**, built by Fixible IT.

- Kotlin + Jetpack Compose + Material 3 (premium navy/gold theme, light by default, dark available)
- Room (local source of truth) + Firebase Firestore (sync) + Firebase Auth
- WorkManager for durable offline sync with retry + conflict detection
- Hilt dependency injection
- Role-based access: **Owner / Master Admin** and **Shop Staff** (up to 4 users)
- Modules: Dashboard (10 KPIs), Rice Inventory, Gas & Cylinder Management, Customer & Supplier Ledgers, Shop Expenses, Reports, Settings
- Local database backup & restore
- Audit trail for every owner-level correction

See the `docs/` folder for setup, Firebase configuration, security rules, testing, and backup instructions.

## Project structure

```
app/src/main/java/com/fixibleit/onedesk/
  data/
    local/     (Room entities, DAOs, AppDatabase, converters)
    remote/    (Firebase Auth + Firestore layer, entity mappers)
    sync/      (Sync queue, SyncWorker, PullSyncManager, scheduler)
    repository/(Business logic: Customer, Supplier, Rice, Cylinder, Expense, Dashboard, Backup, Audit)
    model/     (Enums shared across the data layer)
  domain/
    model/     (RolePermissions)
  di/          (Hilt modules: Database, Firebase)
  ui/
    theme/     (Color, Theme, Shape, Type)
    common/    (StatCard, SyncStatusBadge, SectionHeader, Loading/Empty states)
    navigation/(Screen routes, NavGraph, bottom bar)
    screens/   (auth, dashboard, gas, rice, customer, supplier, expense, reports, settings)
  util/        (DateUtil, Money, IdGenerator, JsonUtil, RestoreStaging)
```

## Build

```
./gradlew :app:assembleDebug
```

The debug APK lands in `app/build/outputs/apk/debug/app-debug.apk`.

## Attribution

The Dubai Gas & Rice logo is used only as a visual colour reference for the app's theme (deep navy + royal gold). The application icon is the Fixible IT logo (currently a placeholder adaptive icon; swap in the real vector in `res/drawable/ic_launcher_foreground.xml`).
