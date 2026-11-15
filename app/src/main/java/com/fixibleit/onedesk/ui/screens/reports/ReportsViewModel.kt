package com.fixibleit.onedesk.ui.screens.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.dao.RiceProductProfit
import com.fixibleit.onedesk.data.local.entity.CashLedgerEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTransactionEntity
import com.fixibleit.onedesk.data.repository.CylinderRepository
import com.fixibleit.onedesk.data.repository.DashboardRepository
import com.fixibleit.onedesk.data.repository.DashboardSnapshot
import com.fixibleit.onedesk.data.repository.RiceRepository
import com.fixibleit.onedesk.util.DateUtil
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class ReportsUiState(
    val snapshot: DashboardSnapshot? = null,
    val profitByProduct: List<RiceProductProfit> = emptyList(),
    val cashMovementToday: List<CashLedgerEntity> = emptyList(),
    val cylinderExchanges: List<CylinderTransactionEntity> = emptyList(),
    val todaysGrossProfitBDT: Double = 0.0
)

@HiltViewModel
class ReportsViewModel @Inject constructor(
    dashboardRepository: DashboardRepository,
    riceRepository: RiceRepository,
    cylinderRepository: CylinderRepository,
    private val cashLedgerDao: com.fixibleit.onedesk.data.local.dao.CashLedgerDao
) : ViewModel() {

    val uiState: StateFlow<ReportsUiState> = run {
        val now = DateUtil.now()
        val dayStart = DateUtil.startOfDay(now)
        val dayEnd = DateUtil.endOfDay(now)

        combine(
            dashboardRepository.observeSnapshot(),
            riceRepository.observeProfitByProduct(dayStart, dayEnd),
            cashLedgerDao.observeEntriesBetween(dayStart, dayEnd),
            cylinderRepository.observeRecentExchanges(50)
        ) { snapshot, profit, cash, exchanges ->
            ReportsUiState(snapshot, profit, cash, exchanges, profit.sumOf { it.grossProfitBDT })
        }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, ReportsUiState())
}
