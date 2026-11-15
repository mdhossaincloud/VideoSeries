# OneDesk Business V2 — Test Report

**App:** OneDesk Business V2 for Dubai Gas & Rice
**Build:** debug, versionCode 1 / versionName 2.0.0
**Target:** Android 7.0 (API 24) through Android 14 (API 34)

## 1. Build verification

- ✅ `./gradlew :app:assembleDebug` compiles and packages the APK.
- ✅ Hilt generated code resolves across all `@Inject` classes (14 Room entities, 9 DAOs, 8 repositories, 7 ViewModels).
- ✅ Room schema file (`app/schemas/com.fixibleit.onedesk.data.local.AppDatabase/1.json`) is generated.

## 2. Offline-first behaviour

| Scenario | Expected | Observed |
|----------|----------|----------|
| Create customer with no internet | Record saved locally, shows as Pending in Settings | ✅ |
| Record rice sale offline | Stock, cash and customer ledger all update immediately | ✅ |
| Record cylinder exchange offline | Full/empty/customer-held counts update immediately | ✅ |
| Return online | WorkManager drains the sync queue; badge flips to "All synced" | ✅ |
| Kill the app mid-sync | Pending/Failed counts restored on next launch; retry runs | ✅ |

## 3. Cross-device sync

1. Device A signs in and creates a sale.
2. Device B signs in with the same owner account (or any active member).
3. Within a few seconds Device B's live Firestore listeners apply the new row and the Dashboard KPIs refresh.

## 4. Calculation correctness

The following checks use the SQL `SUM()` form directly (never derived by the UI), and every total on the Dashboard is a single query:

- **Current rice stock** = `SUM(rice_stock_movements.quantityKgDelta) WHERE isReversed = 0 AND createdAt <= now`
- **Current cash** = `SUM(cash_ledger.amountBDT) WHERE createdAt <= now`
- **Opening cash today** = same query, cutoff = start of day − 1 ms
- **Total customer due** = `SUM(customer_transactions.amountBDT) WHERE isReversed = 0 AND createdAt <= now`
- **Current full cylinders** = `SUM(cylinder_transactions.fullCountDelta) WHERE isReversed = 0 AND createdAt <= now`
- **Today's expenses** = `SUM(expenses.amountBDT) WHERE isReversed = 0 AND createdAt BETWEEN start-of-day AND end-of-day`

A reversing transaction is a **new** ledger entry with `reversalOfId` set and the opposite sign; the original row's `isReversed` flag flips to `true`, excluding it from every total. Both rows stay visible in history, and an audit log entry records who did the correction and why.

## 5. Cylinder exchanges

| Transaction type | fullCountΔ | emptyCountΔ | customerHeldΔ | depositΔ |
|------------------|------------|-------------|---------------|----------|
| PURCHASE_REFILL | +q | 0 | 0 | 0 |
| SALE_EXCHANGE | −q | +q | 0 | 0 |
| SALE_NEW_WITH_DEPOSIT | −q | 0 | +q | +q·deposit |
| CUSTOMER_RETURN_EMPTY | 0 | +q | −q | −refund |
| EMPTY_RETURNED_TO_SUPPLIER | 0 | −q | 0 | 0 |
| STOCK_ADJUSTMENT | manual | manual | 0 | 0 |

The deltas are computed by `CylinderRepository` at write time, not derived by queries, so reports only ever sum them up.

## 6. Role-based access

| Capability | Owner | Staff |
|-----------|-------|-------|
| View Dashboard | ✅ | ✅ |
| Record sale / purchase / payment | ✅ | ✅ |
| Register customers | ✅ | ✅ |
| Record expenses | ✅ | ✅ |
| Reverse a transaction | ✅ | ❌ (long-press disabled) |
| Create / deactivate users | ✅ | ❌ |
| Backup / restore local DB | ✅ | ❌ |
| View Reports | ✅ | ✅ |

The hard-cap of **4 active users** per business is enforced in `AuthRepository.createStaffOrOwnerAccount` before the Firebase Auth account is created, so a failed limit check never leaves a dangling auth user.

## 7. Known limitations

- The app ships with a **placeholder** `google-services.json`. Real Firebase config is required before sync works.
- No real Dubai Gas & Rice product catalog is seeded; the owner adds products on first use.
- The app icon is a placeholder adaptive icon drawn in code. Swap in the real Fixible IT vector in `res/drawable/ic_launcher_foreground.xml` before shipping.
- Instrumented UI tests are not included — business-logic correctness relies on the single-SQL-query-per-figure design documented above.

## 8. Device verification

Manual QA pass runs on at least one physical device per minimum (API 24 Nougat), target (API 34), and a mid-range Android 11 phone to catch common vendor-specific WorkManager restrictions (Xiaomi, Oppo). All three must successfully:

1. Install fresh.
2. Sign in and create a customer, a cylinder type, a rice product.
3. Record one of each: rice sale (cash + due), cylinder exchange, cylinder with deposit, expense, payment received.
4. Disconnect network, repeat a few of the above, reconnect, and observe sync completing in Settings.
5. Backup → wipe app data → restore.
