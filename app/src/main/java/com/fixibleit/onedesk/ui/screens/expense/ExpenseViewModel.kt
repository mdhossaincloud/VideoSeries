@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
package com.fixibleit.onedesk.ui.screens.expense

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.dao.ExpenseCategoryTotal
import com.fixibleit.onedesk.data.local.dao.ExpenseWithCategory
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.ExpenseRepository
import com.fixibleit.onedesk.util.DateUtil
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class ExpensePeriod { DAY, WEEK, MONTH }

data class ExpenseUiState(
    val period: ExpensePeriod = ExpensePeriod.DAY,
    val categories: List<ExpenseCategoryEntity> = emptyList(),
    val expenses: List<ExpenseWithCategory> = emptyList(),
    val totalsByCategory: List<ExpenseCategoryTotal> = emptyList(),
    val totalBDT: Double = 0.0
)

@HiltViewModel
class ExpenseViewModel @Inject constructor(
    private val expenseRepository: ExpenseRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val period = MutableStateFlow(ExpensePeriod.DAY)

    val uiState: StateFlow<ExpenseUiState> = period.flatMapLatest { p ->
        val (from, to) = rangeFor(p)
        combine(
            expenseRepository.observeCategories(),
            expenseRepository.observeExpensesBetween(from, to),
            expenseRepository.observeTotalsByCategory(from, to),
            expenseRepository.observeTotalBetween(from, to)
        ) { categories, expenses, totals, total ->
            ExpenseUiState(p, categories, expenses, totals, total)
        }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, ExpenseUiState())

    fun setPeriod(p: ExpensePeriod) { period.value = p }

    private fun rangeFor(p: ExpensePeriod): Pair<Long, Long> {
        val now = DateUtil.now()
        val from = when (p) {
            ExpensePeriod.DAY -> DateUtil.startOfDay(now)
            ExpensePeriod.WEEK -> DateUtil.startOfWeek(now)
            ExpensePeriod.MONTH -> DateUtil.startOfMonth(now)
        }
        return from to DateUtil.endOfDay(now)
    }

    fun addCategory(nameBn: String, nameEn: String) {
        viewModelScope.launch { expenseRepository.addCustomCategory(nameBn, nameEn) }
    }

    fun recordExpense(categoryId: String, amountBDT: Double, note: String) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            expenseRepository.recordExpense(categoryId, amountBDT, note, uid)
        }
    }
}
