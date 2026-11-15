package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.CashLedgerDao
import com.fixibleit.onedesk.util.DateUtil
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import javax.inject.Inject
import javax.inject.Singleton

data class DashboardSnapshot(
    val todaysPurchaseValueBDT: Double,
    val todaysSellingValueBDT: Double,
    val openingRiceStockKg: Double,
    val currentRiceStockKg: Double,
    val openingCylinderFullCount: Int,
    val currentCylinderFullCount: Int,
    val openingCashBDT: Double,
    val currentCashBDT: Double,
    val totalCustomerDueBDT: Double,
    val totalSupplierPayableBDT: Double,
    val todaysExpensesBDT: Double
)

private data class PartialA(
    val todaysPurchaseValueBDT: Double,
    val todaysSellingValueBDT: Double,
    val openingRiceStockKg: Double,
    val currentRiceStockKg: Double,
    val openingCylinderFullCount: Int
)

private data class PartialB(
    val currentCylinderFullCount: Int,
    val openingCashBDT: Double,
    val currentCashBDT: Double,
    val totalCustomerDueBDT: Double,
    val totalSupplierPayableBDT: Double
)

/**
 * The one place that assembles the ten dashboard figures (spec section 2), each sourced from
 * exactly one query so the same number can never show up differently on two cards. "Opening"
 * and "current" are the same underlying query with a different timestamp cutoff (start of
 * today vs. now), never two independently maintained counters.
 */
@Singleton
class DashboardRepository @Inject constructor(
    private val riceRepository: RiceRepository,
    private val cylinderRepository: CylinderRepository,
    private val customerRepository: CustomerRepository,
    private val supplierRepository: SupplierRepository,
    private val expenseRepository: ExpenseRepository,
    private val cashLedgerDao: CashLedgerDao
) {
    fun observeSnapshot(): Flow<DashboardSnapshot> {
        val now = DateUtil.now()
        val dayStart = DateUtil.startOfDay(now)
        val dayEnd = DateUtil.endOfDay(now)
        val yesterdayEnd = dayStart - 1

        val partialA: Flow<PartialA> = combine(
            riceRepository.observeTodayPurchaseValue(dayStart, dayEnd),
            cylinderRepository.observeTodayPurchaseValue(dayStart, dayEnd),
            riceRepository.observeTodaySalesValue(dayStart, dayEnd),
            cylinderRepository.observeTodaySalesValue(dayStart, dayEnd),
            riceRepository.observeTotalStockKgAsOf(yesterdayEnd)
        ) { ricePurchase, cylinderPurchase, riceSales, cylinderSales, openingRiceStock ->
            PartialA(ricePurchase + cylinderPurchase, riceSales + cylinderSales, openingRiceStock, 0.0, 0)
        }.combine(riceRepository.observeTotalStockKgAsOf(now)) { partial, currentRiceStock ->
            partial.copy(currentRiceStockKg = currentRiceStock)
        }.combine(cylinderRepository.observeTotalFullAsOf(yesterdayEnd)) { partial, openingFull ->
            partial.copy(openingCylinderFullCount = openingFull)
        }

        val partialB: Flow<PartialB> = combine(
            cylinderRepository.observeTotalFullAsOf(now),
            cashLedgerDao.observeBalanceAsOf(yesterdayEnd),
            cashLedgerDao.observeBalanceAsOf(now),
            customerRepository.observeTotalDue(now),
            supplierRepository.observeTotalPayable(now)
        ) { currentFull, openingCash, currentCash, customerDue, supplierPayable ->
            PartialB(currentFull, openingCash, currentCash, customerDue, supplierPayable)
        }

        return combine(partialA, partialB, expenseRepository.observeTotalBetween(dayStart, dayEnd)) { a, b, todaysExpenses ->
            DashboardSnapshot(
                todaysPurchaseValueBDT = a.todaysPurchaseValueBDT,
                todaysSellingValueBDT = a.todaysSellingValueBDT,
                openingRiceStockKg = a.openingRiceStockKg,
                currentRiceStockKg = a.currentRiceStockKg,
                openingCylinderFullCount = a.openingCylinderFullCount,
                currentCylinderFullCount = b.currentCylinderFullCount,
                openingCashBDT = b.openingCashBDT,
                currentCashBDT = b.currentCashBDT,
                totalCustomerDueBDT = b.totalCustomerDueBDT,
                totalSupplierPayableBDT = b.totalSupplierPayableBDT,
                todaysExpensesBDT = todaysExpenses
            )
        }
    }
}
