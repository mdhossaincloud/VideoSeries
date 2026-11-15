package com.fixibleit.onedesk.di

import android.content.Context
import androidx.room.Room
import com.fixibleit.onedesk.data.local.AppDatabase
import com.fixibleit.onedesk.data.local.dao.AuditLogDao
import com.fixibleit.onedesk.data.local.dao.CashLedgerDao
import com.fixibleit.onedesk.data.local.dao.CustomerDao
import com.fixibleit.onedesk.data.local.dao.CylinderDao
import com.fixibleit.onedesk.data.local.dao.ExpenseDao
import com.fixibleit.onedesk.data.local.dao.RiceDao
import com.fixibleit.onedesk.data.local.dao.SupplierDao
import com.fixibleit.onedesk.data.local.dao.SyncQueueDao
import com.fixibleit.onedesk.data.local.dao.UserDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, AppDatabase.DATABASE_NAME)
            .fallbackToDestructiveMigrationOnDowngrade()
            .build()

    @Provides fun provideUserDao(db: AppDatabase): UserDao = db.userDao()
    @Provides fun provideCustomerDao(db: AppDatabase): CustomerDao = db.customerDao()
    @Provides fun provideSupplierDao(db: AppDatabase): SupplierDao = db.supplierDao()
    @Provides fun provideRiceDao(db: AppDatabase): RiceDao = db.riceDao()
    @Provides fun provideCylinderDao(db: AppDatabase): CylinderDao = db.cylinderDao()
    @Provides fun provideExpenseDao(db: AppDatabase): ExpenseDao = db.expenseDao()
    @Provides fun provideCashLedgerDao(db: AppDatabase): CashLedgerDao = db.cashLedgerDao()
    @Provides fun provideSyncQueueDao(db: AppDatabase): SyncQueueDao = db.syncQueueDao()
    @Provides fun provideAuditLogDao(db: AppDatabase): AuditLogDao = db.auditLogDao()
}
