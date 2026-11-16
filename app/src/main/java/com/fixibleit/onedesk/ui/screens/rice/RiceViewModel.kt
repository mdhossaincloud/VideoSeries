package com.fixibleit.onedesk.ui.screens.rice

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.dao.RiceProductStock
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.RiceProductEntity
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.CustomerRepository
import com.fixibleit.onedesk.data.repository.RiceRepository
import com.fixibleit.onedesk.data.repository.SupplierRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RiceUiState(
    val products: List<RiceProductStock> = emptyList(),
    val customers: List<CustomerEntity> = emptyList(),
    val suppliers: List<SupplierEntity> = emptyList()
)

@HiltViewModel
class RiceViewModel @Inject constructor(
    private val riceRepository: RiceRepository,
    private val customerRepository: CustomerRepository,
    private val supplierRepository: SupplierRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    val uiState: StateFlow<RiceUiState> = combine(
        riceRepository.observeStockAsOf(),
        customerRepository.observeCustomers(),
        supplierRepository.observeSuppliers()
    ) { products, customers, suppliers -> RiceUiState(products, customers, suppliers) }
        .stateIn(viewModelScope, SharingStarted.Eagerly, RiceUiState())

    /** Add a brand-new product, OR update an existing one in place (same id -> Room REPLACE). */
    fun saveProduct(existingId: String?, name: String, purchasePrice: Double, sellingPrice: Double, kgPerSack: Double) {
        viewModelScope.launch { riceRepository.addOrUpdateProduct(existingId, name, purchasePrice, sellingPrice, kgPerSack) }
    }

    /** Explicit stock correction. Posts a signed quantityKgDelta that the stock SUM() picks up. */
    fun adjustStock(product: RiceProductStock, newStockKg: Double, note: String) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            val delta = newStockKg - product.currentStockKg
            if (delta == 0.0) return@launch
            riceRepository.recordStockAdjustment(toEntity(product), delta, note.ifBlank { "Manual adjustment" }, uid)
        }
    }

    fun recordSale(product: RiceProductStock, quantityKg: Double, unitPrice: Double, paidCash: Double, due: Double, customer: CustomerEntity?) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            val entity = toEntity(product)
            riceRepository.recordSale(entity, quantityKg, unitPrice, paidCash, due, customer, "Rice sale", uid)
        }
    }

    fun recordPurchase(product: RiceProductStock, quantityKg: Double, unitPrice: Double, paidCash: Double, due: Double, supplier: SupplierEntity?) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            val entity = toEntity(product)
            riceRepository.recordPurchase(entity, quantityKg, unitPrice, paidCash, due, supplier, "Rice purchase", uid)
        }
    }

    private fun toEntity(p: RiceProductStock) = RiceProductEntity(
        id = p.id, name = p.name, purchasePricePerKgBDT = p.purchasePricePerKgBDT,
        sellingPricePerKgBDT = p.sellingPricePerKgBDT, kgPerSack = p.kgPerSack, createdAt = 0L, updatedAt = 0L
    )
}
