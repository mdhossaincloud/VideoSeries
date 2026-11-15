package com.fixibleit.onedesk.ui.screens.customer

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.CustomerTransactionEntity
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.CustomerRepository
import com.fixibleit.onedesk.domain.model.RolePermissions
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CustomerDetailUiState(
    val customer: CustomerEntity? = null,
    val transactions: List<CustomerTransactionEntity> = emptyList(),
    val currentDue: Double = 0.0,
    val canReverse: Boolean = false
)

@HiltViewModel
class CustomerDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val customerRepository: CustomerRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val customerId: String = checkNotNull(savedStateHandle["customerId"])

    private val _state = MutableStateFlow(CustomerDetailUiState())
    val uiState: StateFlow<CustomerDetailUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val customer = customerRepository.getById(customerId)
            combine(
                customerRepository.observeTransactions(customerId),
                authRepository.currentUser
            ) { txns, user ->
                val due = txns.filterNot { it.isReversed }.sumOf { it.amountBDT }
                CustomerDetailUiState(
                    customer = customer, transactions = txns, currentDue = due,
                    canReverse = user?.let { RolePermissions.canDeleteOrReverseFinancialRecords(it.role) } ?: false
                )
            }.collect { _state.value = it }
        }
    }

    fun recordPayment(amountBDT: Double, note: String) {
        val customer = _state.value.customer ?: return
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            customerRepository.recordPayment(customer, amountBDT, note, uid)
        }
    }

    fun recordCreditSale(amountBDT: Double, note: String) {
        val customer = _state.value.customer ?: return
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            customerRepository.recordSaleOnCredit(customer, amountBDT, com.fixibleit.onedesk.data.model.ReferenceType.NONE, null, note, uid)
        }
    }

    fun reverseTransaction(txn: CustomerTransactionEntity, reason: String) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            customerRepository.reverseTransaction(txn, reason, uid)
        }
    }
}
