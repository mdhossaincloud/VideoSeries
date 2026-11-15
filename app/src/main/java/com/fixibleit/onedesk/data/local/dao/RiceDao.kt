package com.fixibleit.onedesk.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.fixibleit.onedesk.data.local.entity.RiceProductEntity
import com.fixibleit.onedesk.data.local.entity.RiceStockMovementEntity
import kotlinx.coroutines.flow.Flow

data class RiceProductStock(
    val id: String,
    val name: String,
    val purchasePricePerKgBDT: Double,
    val sellingPricePerKgBDT: Double,
    val kgPerSack: Double,
    val currentStockKg: Double
)

data class RiceProductProfit(
    val productId: String,
    val productName: String,
    val soldKg: Double,
    val salesValueBDT: Double,
    val costOfGoodsBDT: Double,
    val grossProfitBDT: Double
)

@Dao
interface RiceDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProduct(product: RiceProductEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovement(movement: RiceStockMovementEntity)

    @Query("SELECT * FROM rice_products WHERE isActive = 1 ORDER BY name ASC")
    fun observeProducts(): Flow<List<RiceProductEntity>>

    @Query("SELECT * FROM rice_products WHERE id = :id LIMIT 1")
    suspend fun getProductById(id: String): RiceProductEntity?

    @Query(
        """
        SELECT p.id as id, p.name as name, p.purchasePricePerKgBDT as purchasePricePerKgBDT,
               p.sellingPricePerKgBDT as sellingPricePerKgBDT, p.kgPerSack as kgPerSack,
               COALESCE((SELECT SUM(m.quantityKgDelta) FROM rice_stock_movements m
                         WHERE m.productId = p.id AND m.isReversed = 0 AND m.createdAt <= :asOf), 0.0) as currentStockKg
        FROM rice_products p
        WHERE p.isActive = 1
        ORDER BY p.name ASC
        """
    )
    fun observeStockAsOf(asOf: Long): Flow<List<RiceProductStock>>

    @Query(
        """
        SELECT COALESCE(SUM(m.quantityKgDelta), 0.0) FROM rice_stock_movements m
        WHERE m.isReversed = 0 AND m.createdAt <= :asOf
        """
    )
    fun observeTotalStockKgAsOf(asOf: Long): Flow<Double>

    @Query(
        """
        SELECT COALESCE(SUM(totalAmountBDT), 0.0) FROM rice_stock_movements
        WHERE type = 'PURCHASE' AND isReversed = 0 AND createdAt BETWEEN :dayStart AND :dayEnd
        """
    )
    fun observeTodayPurchaseValue(dayStart: Long, dayEnd: Long): Flow<Double>

    @Query(
        """
        SELECT COALESCE(SUM(totalAmountBDT), 0.0) FROM rice_stock_movements
        WHERE type = 'SALE' AND isReversed = 0 AND createdAt BETWEEN :dayStart AND :dayEnd
        """
    )
    fun observeTodaySalesValue(dayStart: Long, dayEnd: Long): Flow<Double>

    @Query("SELECT * FROM rice_stock_movements WHERE productId = :productId ORDER BY createdAt DESC")
    fun observeMovements(productId: String): Flow<List<RiceStockMovementEntity>>

    @Query(
        """
        SELECT
            p.id as productId,
            p.name as productName,
            COALESCE(-SUM(CASE WHEN m.type = 'SALE' THEN m.quantityKgDelta ELSE 0 END), 0.0) as soldKg,
            COALESCE(SUM(CASE WHEN m.type = 'SALE' THEN m.totalAmountBDT ELSE 0 END), 0.0) as salesValueBDT,
            COALESCE(-SUM(CASE WHEN m.type = 'SALE' THEN m.quantityKgDelta * p.purchasePricePerKgBDT ELSE 0 END), 0.0) as costOfGoodsBDT,
            COALESCE(SUM(CASE WHEN m.type = 'SALE' THEN m.totalAmountBDT ELSE 0 END), 0.0)
                - COALESCE(-SUM(CASE WHEN m.type = 'SALE' THEN m.quantityKgDelta * p.purchasePricePerKgBDT ELSE 0 END), 0.0) as grossProfitBDT
        FROM rice_products p
        LEFT JOIN rice_stock_movements m ON m.productId = p.id AND m.isReversed = 0
            AND m.createdAt BETWEEN :fromTs AND :toTs
        WHERE p.isActive = 1
        GROUP BY p.id, p.name
        ORDER BY grossProfitBDT DESC
        """
    )
    fun observeProfitByProduct(fromTs: Long, toTs: Long): Flow<List<RiceProductProfit>>
}
