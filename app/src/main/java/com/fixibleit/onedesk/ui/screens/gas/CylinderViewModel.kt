package com.fixibleit.onedesk.ui.screens.gas

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.dao.CustomerCylinderHolding
import com.fixibleit.onedesk.data.local.dao.CylinderTypeInventory
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTypeEntity
import com.fixibleit.onedesk.data.model.CylinderMaterial
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.CustomerRepository
import com.fixibleit.onedesk.data.repository.CylinderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CylinderUiState(
    val inventory: List<CylinderTypeInventory> = emptyList(),
    val holdings: List<CustomerCylinderHolding> = emptyList(),
    val customers: List<CustomerEntity> = emptyList(),
    val message: String? = null
)

@HiltViewModel
class CylinderViewModel @Inject constructor(
    private val cylinderRepository: CylinderRepository,
    private val customerRepository: CustomerRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    val uiState: StateFlow<CylinderUiState> = combine(
        cylinderRepository.observeInventoryAsOf(),
        cylinderRepository.observeCustomerHoldings(),
        customerRepository.observeCustomers()
    ) { inventory, holdings, customers ->
        CylinderUiState(inventory, holdings, customers)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, CylinderUiState())

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()
    fun clearMessage() { _message.value = null }

    fun saveType(existingId: String?, brand: String, size: String, material: CylinderMaterial, purchasePrice: Double, sellingPrice: Double, deposit: Double) {
        viewModelScope.launch {
            cylinderRepository.addOrUpdateType(existingId, brand, size, material, purchasePrice, sellingPrice, deposit)
        }
    }

    /** Explicit full/empty count correction. */
    fun adjustCylinderStock(type: com.fixibleit.onedesk.data.local.dao.CylinderTypeInventory, newFull: Int, newEmpty: Int, note: String) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            val entity = com.fixibleit.onedesk.data.local.entity.CylinderTypeEntity(
                id = type.id, brand = type.brand, sizeLabel = type.sizeLabel,
                material = CylinderMaterial.valueOf(type.material),
                purchasePriceBDT = 0.0, sellingPriceBDT = 0.0, depositAmountBDT = 0.0,
                createdAt = 0L, updatedAt = 0L
            )
            val fullDelta = newFull - type.fullCount
            val emptyDelta = newEmpty - type.emptyCount
            if (fullDelta != 0 || emptyDelta != 0) {
                cylinderRepository.recordStockAdjustment(entity, fullDelta, emptyDelta, note.ifBlank { "Manual adjustment" }, uid)
            }
        }
    }

    fun recordPurchaseRefill(type: CylinderTypeEntity, quantity: Int, unitCost: Double, paidCash: Double, due: Double) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            cylinderRepository.recordPurchaseRefill(type, quantity, unitCost, paidCash, due, null, "Refill purchase", uid)
            _message.value = "Purchase recorded"
        }
    }

    fun recordSaleExchange(type: CylinderTypeEntity, quantity: Int, unitPrice: Double, paidCash: Double, due: Double, customer: CustomerEntity?) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            cylinderRepository.recordSaleExchange(type, quantity, unitPrice, paidCash, due, customer, "Exchange sale", uid)
            _message.value = "Exchange sale recorded"
        }
    }

    fun recordSaleNewWithDeposit(type: CylinderTypeEntity, quantity: Int, unitPrice: Double, deposit: Double, paidCash: Double, due: Double, customer: CustomerEntity) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            cylinderRepository.recordSaleNewWithDeposit(type, quantity, unitPrice, deposit, paidCash, due, customer, "New cylinder with deposit", uid)
            _message.value = "New cylinder sale recorded"
        }
    }

    fun recordReturnEmpty(type: CylinderTypeEntity, quantity: Int, customer: CustomerEntity, refundDeposit: Double) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            cylinderRepository.recordCustomerReturnEmpty(type, quantity, customer, refundDeposit, "Customer returned empty", uid)
            _message.value = "Return recorded"
        }
    }
}
