package com.fixibleit.onedesk.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.local.dao.CylinderTypeInventory
import com.fixibleit.onedesk.data.local.dao.RiceProductStock
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTypeEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.data.local.entity.RiceProductEntity
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.data.model.CashTxnType
import com.fixibleit.onedesk.data.model.ReferenceType
import com.fixibleit.onedesk.data.repository.AuthRepository
import com.fixibleit.onedesk.data.repository.CustomerRepository
import com.fixibleit.onedesk.data.repository.CylinderRepository
import com.fixibleit.onedesk.data.repository.DashboardRepository
import com.fixibleit.onedesk.data.repository.DashboardSnapshot
import com.fixibleit.onedesk.data.repository.ExpenseRepository
import com.fixibleit.onedesk.data.repository.RiceRepository
import com.fixibleit.onedesk.data.repository.SupplierRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardOptions(
    val riceProducts: List<RiceProductStock> = emptyList(),
    val cylinderTypes: List<CylinderTypeInventory> = emptyList(),
    val customers: List<CustomerEntity> = emptyList(),
    val suppliers: List<SupplierEntity> = emptyList(),
    val expenseCategories: List<ExpenseCategoryEntity> = emptyList()
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    dashboardRepository: DashboardRepository,
    private val riceRepository: RiceRepository,
    private val cylinderRepository: CylinderRepository,
    private val customerRepository: CustomerRepository,
    private val supplierRepository: SupplierRepository,
    private val expenseRepository: ExpenseRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    val snapshot: StateFlow<DashboardSnapshot?> = dashboardRepository.observeSnapshot()
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val options: StateFlow<DashboardOptions> = combine(
        riceRepository.observeStockAsOf(),
        cylinderRepository.observeInventoryAsOf(),
        customerRepository.observeCustomers(),
        supplierRepository.observeSuppliers(),
        expenseRepository.observeCategories()
    ) { rice, cyl, cust, supp, cat ->
        DashboardOptions(rice, cyl, cust, supp, cat)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, DashboardOptions())

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()
    fun clearMessage() { _message.value = null }

    fun quickSellRice(product: RiceProductStock, quantityKg: Double, unitPrice: Double, cash: Double, due: Double, customer: CustomerEntity?) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            runCatching {
                riceRepository.recordSale(toEntity(product), quantityKg, unitPrice, cash, due, customer, "Quick sale", uid)
            }.onSuccess { _message.value = "Rice sale saved ✓" }
             .onFailure { _message.value = "Could not save: ${it.message}" }
        }
    }

    fun quickSellCylinder(type: CylinderTypeInventory, quantity: Int, unitPrice: Double, cash: Double, due: Double, customer: CustomerEntity?, isExchange: Boolean, depositPerUnit: Double) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            val entity = toCylinderEntity(type, depositPerUnit)
            runCatching {
                if (isExchange || customer == null) {
                    cylinderRepository.recordSaleExchange(entity, quantity, unitPrice, cash, due, customer, "Quick exchange", uid)
                } else {
                    cylinderRepository.recordSaleNewWithDeposit(entity, quantity, unitPrice, depositPerUnit, cash, due, customer, "Quick new cylinder", uid)
                }
            }.onSuccess { _message.value = "Cylinder sale saved ✓" }
             .onFailure { _message.value = "Could not save: ${it.message}" }
        }
    }

    fun quickRecordExpense(categoryId: String, amount: Double, note: String) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            runCatching { expenseRepository.recordExpense(categoryId, amount, note, uid) }
                .onSuccess { _message.value = "Expense recorded ✓" }
                .onFailure { _message.value = "Could not save: ${it.message}" }
        }
    }

    fun quickReceivePayment(customer: CustomerEntity, amount: Double, note: String) {
        viewModelScope.launch {
            val uid = authRepository.currentUserIdOrNull() ?: return@launch
            runCatching { customerRepository.recordPayment(customer, amount, note, uid) }
                .onSuccess { _message.value = "Payment received ✓" }
                .onFailure { _message.value = "Could not save: ${it.message}" }
        }
    }

    private fun toEntity(p: RiceProductStock) = RiceProductEntity(
        id = p.id, name = p.name, purchasePricePerKgBDT = p.purchasePricePerKgBDT,
        sellingPricePerKgBDT = p.sellingPricePerKgBDT, kgPerSack = p.kgPerSack, createdAt = 0L, updatedAt = 0L
    )

    private fun toCylinderEntity(i: CylinderTypeInventory, deposit: Double) = CylinderTypeEntity(
        id = i.id, brand = i.brand, sizeLabel = i.sizeLabel,
        material = com.fixibleit.onedesk.data.model.CylinderMaterial.valueOf(i.material),
        purchasePriceBDT = 0.0, sellingPriceBDT = 0.0, depositAmountBDT = deposit,
        createdAt = 0L, updatedAt = 0L
    )
}
