package com.fixibleit.onedesk.ui.screens.customer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.dao.CustomerWithDue
import com.fixibleit.onedesk.data.local.dao.SupplierWithPayable
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.CustomerRepository
import com.fixibleit.onedesk.data.repository.SupplierRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AccountsUiState(
    val customers: List<CustomerWithDue> = emptyList(),
    val suppliers: List<SupplierWithPayable> = emptyList()
)

@HiltViewModel
class AccountsViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    private val supplierRepository: SupplierRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    val uiState: StateFlow<AccountsUiState> = combine(
        customerRepository.observeDues(),
        supplierRepository.observePayables()
    ) { customers, suppliers -> AccountsUiState(customers, suppliers) }
        .stateIn(viewModelScope, SharingStarted.Eagerly, AccountsUiState())

    fun addCustomer(name: String, mobile: String, address: String, openingBalance: Double) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            customerRepository.addCustomer(name, mobile, address, openingBalance, uid)
        }
    }

    fun addSupplier(name: String, mobile: String, address: String, openingBalance: Double) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            supplierRepository.addSupplier(name, mobile, address, openingBalance, uid)
        }
    }
}
