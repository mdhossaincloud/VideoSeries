# Content Accuracy & Duplicate Cleanup

Per Section 10 of the master prompt, every dashboard card, label and report metric was audited for duplication and authoritative wording.

## Mandatory wording correction

| Original | Replacement | Where it appears |
|----------|-------------|------------------|
| গ্যাস কেনাবেচার মূল্য কি | **আজকের বিক্রিমূল্য কত** | Dashboard "Today's Selling Value" card |

The replaced text is used verbatim in `DashboardScreen.kt` on the "আজকের বিক্রিমূল্য (Today's Selling Value)" tile.

## One-metric-one-query policy

Every figure shown anywhere in the app is sourced from **exactly one** SQL query (see `TEST_REPORT.md` §4). The Dashboard, Reports, Customer Detail, Supplier Detail and Expense screens all consume the same `DAO`/repository Flows — never a locally recomputed shadow value — so numbers cannot drift between cards.

Examples:

- "Today's Selling Value" on the Dashboard and "Selling Value" on the Reports screen both read `RiceDao.observeTodaySalesValue(...) + CylinderDao.observeTodaySalesValue(...)` — identical calls.
- "Total Customer Due" on the Dashboard and the customer list's rows both read `CustomerDao`'s `SUM(customer_transactions.amountBDT)` with `isReversed = 0` — a per-customer total aggregated the same way for the grand total.
- "Current Cash" and "Opening Cash" both go through `CashLedgerDao.observeBalanceAsOf(cutoff)` — the only difference is which cutoff timestamp is passed.

## Terminology consistency

All Bangla terminology is centralised in the screen strings themselves (not in `strings.xml`) because every screen uses a bilingual label like `আজকের মাল কেনা (Today's Purchases)`. If terminology drift is ever observed, the single fix is in the screen file — never split across a cached label and a derived figure.

## Removed duplicate cards

The Dashboard explicitly shows **ten** figures matching the master prompt's items 1-10 and no more. Secondary breakdowns (per-product profit, per-category expense totals, customer holdings) live on the Reports screen, the Expense screen and the Cylinder screen respectively, so the Dashboard never doubles up.
