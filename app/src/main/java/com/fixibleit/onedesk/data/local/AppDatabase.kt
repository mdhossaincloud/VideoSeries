package com.fixibleit.onedesk.data.local

import androidx.room.AutoMigration
import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.fixibleit.onedesk.data.local.converter.Converters
import com.fixibleit.onedesk.data.local.dao.AuditLogDao
import com.fixibleit.onedesk.data.local.dao.CashLedgerDao
import com.fixibleit.onedesk.data.local.dao.CustomerDao
import com.fixibleit.onedesk.data.local.dao.CylinderDao
import com.fixibleit.onedesk.data.local.dao.ExpenseDao
import com.fixibleit.onedesk.data.local.dao.RiceDao
import com.fixibleit.onedesk.data.local.dao.SupplierDao
import com.fixibleit.onedesk.data.local.dao.SyncQueueDao
import com.fixibleit.onedesk.data.local.dao.UserDao
import com.fixibleit.onedesk.data.local.entity.AuditLogEntity
import com.fixibleit.onedesk.data.local.entity.CashLedgerEntity
import com.fixibleit.onedesk.data.local.entity.CustomerEntity
import com.fixibleit.onedesk.data.local.entity.CustomerTransactionEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTransactionEntity
import com.fixibleit.onedesk.data.local.entity.CylinderTypeEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.data.local.entity.ExpenseEntity
import com.fixibleit.onedesk.data.local.entity.RiceProductEntity
import com.fixibleit.onedesk.data.local.entity.RiceStockMovementEntity
import com.fixibleit.onedesk.data.local.entity.SupplierEntity
import com.fixibleit.onedesk.data.local.entity.SupplierTransactionEntity
import com.fixibleit.onedesk.data.local.entity.SyncQueueEntity
import com.fixibleit.onedesk.data.local.entity.UserEntity

@Database(
    entities = [
        UserEntity::class,
        CustomerEntity::class,
        CustomerTransactionEntity::class,
        SupplierEntity::class,
        SupplierTransactionEntity::class,
        RiceProductEntity::class,
        RiceStockMovementEntity::class,
        CylinderTypeEntity::class,
        CylinderTransactionEntity::class,
        ExpenseCategoryEntity::class,
        ExpenseEntity::class,
        CashLedgerEntity::class,
        SyncQueueEntity::class,
        AuditLogEntity::class
    ],
    version = 2,
    autoMigrations = [AutoMigration(from = 1, to = 2)],
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun customerDao(): CustomerDao
    abstract fun supplierDao(): SupplierDao
    abstract fun riceDao(): RiceDao
    abstract fun cylinderDao(): CylinderDao
    abstract fun expenseDao(): ExpenseDao
    abstract fun cashLedgerDao(): CashLedgerDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun auditLogDao(): AuditLogDao

    companion object {
        const val DATABASE_NAME = "onedesk_business.db"
    }
}
