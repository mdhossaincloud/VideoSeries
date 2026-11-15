package com.fixibleit.onedesk.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.fixibleit.onedesk.data.local.entity.CylinderTransactionEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTypeEntity
import kotlinx.coroutines.flow.Flow

data class CylinderTypeInventory(
    val id: String,
    val brand: String,
    val sizeLabel: String,
    val material: String,
    val fullCount: Int,
    val emptyCount: Int,
    val customerHeldCount: Int,
    val depositLiabilityBDT: Double
)

data class CustomerCylinderHolding(
    val customerId: String,
    val customerName: String,
    val cylinderTypeId: String,
    val brand: String,
    val sizeLabel: String,
    val heldCount: Int,
    val depositHeldBDT: Double
)

@Dao
interface CylinderDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertType(type: CylinderTypeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(txn: CylinderTransactionEntity)

    @Query("SELECT * FROM cylinder_types WHERE isActive = 1 ORDER BY brand ASC, sizeLabel ASC")
    fun observeTypes(): Flow<List<CylinderTypeEntity>>

    @Query("SELECT * FROM cylinder_types WHERE id = :id LIMIT 1")
    suspend fun getTypeById(id: String): CylinderTypeEntity?

    @Query(
        """
        SELECT t.id as id, t.brand as brand, t.sizeLabel as sizeLabel, t.material as material,
            COALESCE((SELECT SUM(x.fullCountDelta) FROM cylinder_transactions x WHERE x.cylinderTypeId = t.id AND x.isReversed = 0 AND x.createdAt <= :asOf), 0) as fullCount,
            COALESCE((SELECT SUM(x.emptyCountDelta) FROM cylinder_transactions x WHERE x.cylinderTypeId = t.id AND x.isReversed = 0 AND x.createdAt <= :asOf), 0) as emptyCount,
            COALESCE((SELECT SUM(x.customerHeldDelta) FROM cylinder_transactions x WHERE x.cylinderTypeId = t.id AND x.isReversed = 0 AND x.createdAt <= :asOf), 0) as customerHeldCount,
            COALESCE((SELECT SUM(x.depositLiabilityDeltaBDT) FROM cylinder_transactions x WHERE x.cylinderTypeId = t.id AND x.isReversed = 0 AND x.createdAt <= :asOf), 0.0) as depositLiabilityBDT
        FROM cylinder_types t
        WHERE t.isActive = 1
        ORDER BY t.brand ASC, t.sizeLabel ASC
        """
    )
    fun observeInventoryAsOf(asOf: Long): Flow<List<CylinderTypeInventory>>

    @Query(
        """
        SELECT COALESCE(SUM(fullCountDelta), 0) FROM cylinder_transactions
        WHERE isReversed = 0 AND createdAt <= :asOf
        """
    )
    fun observeTotalFullAsOf(asOf: Long): Flow<Int>

    @Query(
        """
        SELECT COALESCE(SUM(emptyCountDelta), 0) FROM cylinder_transactions
        WHERE isReversed = 0 AND createdAt <= :asOf
        """
    )
    fun observeTotalEmptyAsOf(asOf: Long): Flow<Int>

    @Query(
        """
        SELECT COALESCE(SUM(customerHeldDelta), 0) FROM cylinder_transactions
        WHERE isReversed = 0 AND createdAt <= :asOf
        """
    )
    fun observeTotalCustomerHeldAsOf(asOf: Long): Flow<Int>

    @Query(
        """
        SELECT
            c.id as customerId, c.name as customerName,
            x.cylinderTypeId as cylinderTypeId, t.brand as brand, t.sizeLabel as sizeLabel,
            SUM(x.customerHeldDelta) as heldCount,
            SUM(x.depositLiabilityDeltaBDT) as depositHeldBDT
        FROM cylinder_transactions x
        JOIN customers c ON c.id = x.customerId
        JOIN cylinder_types t ON t.id = x.cylinderTypeId
        WHERE x.customerId IS NOT NULL AND x.isReversed = 0
        GROUP BY c.id, x.cylinderTypeId
        HAVING SUM(x.customerHeldDelta) > 0
        ORDER BY c.name ASC
        """
    )
    fun observeCustomerHoldings(): Flow<List<CustomerCylinderHolding>>

    @Query(
        """
        SELECT COALESCE(SUM(amountBDT), 0.0) FROM cylinder_transactions
        WHERE type = 'PURCHASE_REFILL' AND isReversed = 0 AND createdAt BETWEEN :dayStart AND :dayEnd
        """
    )
    fun observeTodayPurchaseValue(dayStart: Long, dayEnd: Long): Flow<Double>

    @Query(
        """
        SELECT COALESCE(SUM(amountBDT), 0.0) FROM cylinder_transactions
        WHERE type IN ('SALE_EXCHANGE', 'SALE_NEW_WITH_DEPOSIT') AND isReversed = 0 AND createdAt BETWEEN :dayStart AND :dayEnd
        """
    )
    fun observeTodaySalesValue(dayStart: Long, dayEnd: Long): Flow<Double>

    @Query("SELECT * FROM cylinder_transactions WHERE cylinderTypeId = :typeId ORDER BY createdAt DESC")
    fun observeTransactions(typeId: String): Flow<List<CylinderTransactionEntity>>

    @Query("SELECT * FROM cylinder_transactions WHERE type = 'SALE_EXCHANGE' ORDER BY createdAt DESC LIMIT :limit")
    fun observeRecentExchanges(limit: Int = 50): Flow<List<CylinderTransactionEntity>>
}
