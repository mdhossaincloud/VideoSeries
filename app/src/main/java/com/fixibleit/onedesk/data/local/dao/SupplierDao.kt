package com.fixibleit.onedesk.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.data.local.entity.SupplierTransactionEntity
import kotlinx.coroutines.flow.Flow

data class SupplierWithPayable(
    val id: String,
    val name: String,
    val mobile: String,
    val address: String,
    val payableBDT: Double
)

@Dao
interface SupplierDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSupplier(supplier: SupplierEntity)

    @Update
    suspend fun updateSupplier(supplier: SupplierEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(txn: SupplierTransactionEntity)

    @Query("SELECT * FROM suppliers WHERE isActive = 1 ORDER BY name ASC")
    fun observeSuppliers(): Flow<List<SupplierEntity>>

    @Query("SELECT * FROM suppliers WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): SupplierEntity?

    @Query(
        """
        SELECT s.id as id, s.name as name, s.mobile as mobile, s.address as address,
               COALESCE((SELECT SUM(t.amountBDT) FROM supplier_transactions t
                         WHERE t.supplierId = s.id AND t.isReversed = 0 AND t.createdAt <= :asOf), 0.0) as payableBDT
        FROM suppliers s
        WHERE s.isActive = 1
        ORDER BY payableBDT DESC
        """
    )
    fun observeSupplierPayables(asOf: Long): Flow<List<SupplierWithPayable>>

    @Query(
        """
        SELECT COALESCE(SUM(amountBDT), 0.0) FROM supplier_transactions
        WHERE isReversed = 0 AND createdAt <= :asOf
        """
    )
    fun observeTotalSupplierPayable(asOf: Long): Flow<Double>

    @Query(
        """
        SELECT COALESCE(SUM(amountBDT), 0.0) FROM supplier_transactions
        WHERE supplierId = :supplierId AND isReversed = 0 AND createdAt <= :asOf
        """
    )
    suspend fun payableAsOf(supplierId: String, asOf: Long): Double

    @Query("SELECT * FROM supplier_transactions WHERE supplierId = :supplierId ORDER BY createdAt DESC")
    fun observeTransactions(supplierId: String): Flow<List<SupplierTransactionEntity>>

    @Transaction
    suspend fun recordTransactionAndBump(supplier: SupplierEntity, txn: SupplierTransactionEntity) {
        insertTransaction(txn)
        updateSupplier(supplier.copy(updatedAt = txn.createdAt))
    }
}
