package com.fixibleit.onedesk.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.CustomerTransactionEntity
import kotlinx.coroutines.flow.Flow

data class CustomerWithDue(
    val id: String,
    val name: String,
    val mobile: String,
    val address: String,
    val dueBDT: Double
)

@Dao
interface CustomerDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCustomer(customer: CustomerEntity)

    @Update
    suspend fun updateCustomer(customer: CustomerEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(txn: CustomerTransactionEntity)

    @Query("SELECT * FROM customers WHERE isActive = 1 ORDER BY name ASC")
    fun observeCustomers(): Flow<List<CustomerEntity>>

    @Query("SELECT * FROM customers WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): CustomerEntity?

    @Query(
        """
        SELECT c.id as id, c.name as name, c.mobile as mobile, c.address as address,
               COALESCE((SELECT SUM(t.amountBDT) FROM customer_transactions t
                         WHERE t.customerId = c.id AND t.isReversed = 0 AND t.createdAt <= :asOf), 0.0) as dueBDT
        FROM customers c
        WHERE c.isActive = 1
        ORDER BY dueBDT DESC
        """
    )
    fun observeCustomerDues(asOf: Long): Flow<List<CustomerWithDue>>

    @Query(
        """
        SELECT COALESCE(SUM(amountBDT), 0.0) FROM customer_transactions
        WHERE customerId = :customerId AND isReversed = 0 AND createdAt <= :asOf
        """
    )
    suspend fun dueAsOf(customerId: String, asOf: Long): Double

    @Query(
        """
        SELECT COALESCE(SUM(amountBDT), 0.0) FROM customer_transactions
        WHERE isReversed = 0 AND createdAt <= :asOf
        """
    )
    fun observeTotalCustomerDue(asOf: Long): Flow<Double>

    @Query("SELECT * FROM customer_transactions WHERE customerId = :customerId ORDER BY createdAt DESC")
    fun observeTransactions(customerId: String): Flow<List<CustomerTransactionEntity>>

    @Transaction
    suspend fun recordTransactionAndBump(customer: CustomerEntity, txn: CustomerTransactionEntity) {
        insertTransaction(txn)
        updateCustomer(customer.copy(updatedAt = txn.createdAt))
    }
}
