package com.fixibleit.onedesk.ui.screens.supplier

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.data.local.entity.SupplierTransactionEntity
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.SupplierRepository
import com.fixibleit.onedesk.domain.model.RolePermissions
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SupplierDetailUiState(
    val supplier: SupplierEntity? = null,
    val transactions: List<SupplierTransactionEntity> = emptyList(),
    val currentPayable: Double = 0.0,
    val canReverse: Boolean = false
)

@HiltViewModel
class SupplierDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val supplierRepository: SupplierRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val supplierId: String = checkNotNull(savedStateHandle["supplierId"])

    private val _state = MutableStateFlow(SupplierDetailUiState())
    val uiState: StateFlow<SupplierDetailUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val supplier = supplierRepository.getById(supplierId)
            combine(
                supplierRepository.observeTransactions(supplierId),
                authRepository.currentUser
            ) { txns, user ->
                val payable = txns.filterNot { it.isReversed }.sumOf { it.amountBDT }
                SupplierDetailUiState(
                    supplier = supplier, transactions = txns, currentPayable = payable,
                    canReverse = user?.let { RolePermissions.canDeleteOrReverseFinancialRecords(it.role) } ?: false
                )
            }.collect { _state.value = it }
        }
    }

    fun recordPayment(amountBDT: Double, note: String) {
        val supplier = _state.value.supplier ?: return
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            supplierRepository.recordPayment(supplier, amountBDT, note, uid)
        }
    }

    fun recordCreditPurchase(amountBDT: Double, note: String) {
        val supplier = _state.value.supplier ?: return
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            supplierRepository.recordPurchaseOnCredit(supplier, amountBDT, com.fixibleit.onedesk.data.model.ReferenceType.NONE, null, note, uid)
        }
    }

    fun reverseTransaction(txn: SupplierTransactionEntity, reason: String) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            supplierRepository.reverseTransaction(txn, reason, uid)
        }
    }
}
