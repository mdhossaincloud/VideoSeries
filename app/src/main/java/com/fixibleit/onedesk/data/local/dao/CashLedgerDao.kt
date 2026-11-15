package com.fixibleit.onedesk.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.fixibleit.onedesk.data.local.entity.CashLedgerEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CashLedgerDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: CashLedgerEntity)

    /** Cash-in-hand at any instant = SUM(amountBDT) up to that instant. Same query, different cutoff,
     * is used for both "opening cash today" (cutoff = start of today) and "current cash" (cutoff = now),
     * so the two numbers can never be computed by two different code paths. */
    @Query("SELECT COALESCE(SUM(amountBDT), 0.0) FROM cash_ledger WHERE createdAt <= :asOf")
    fun observeBalanceAsOf(asOf: Long): Flow<Double>

    @Query("SELECT COALESCE(SUM(amountBDT), 0.0) FROM cash_ledger WHERE createdAt <= :asOf")
    suspend fun balanceAsOf(asOf: Long): Double

    @Query("SELECT * FROM cash_ledger WHERE createdAt BETWEEN :fromTs AND :toTs ORDER BY createdAt DESC")
    fun observeEntriesBetween(fromTs: Long, toTs: Long): Flow<List<CashLedgerEntity>>
}
