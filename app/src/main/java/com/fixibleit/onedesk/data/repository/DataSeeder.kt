package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.ExpenseDao
import com.fixibleit.onedesk.data.local.entity.ExpenseCategoryEntity
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.IdGenerator
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Seeds only the expense categories named explicitly in the spec (section 6). Rice products
 * and cylinder types are deliberately NOT seeded with invented names/prices - the owner adds
 * Dubai Gas & Rice's real catalog from Settings on first run, because guessing that data would
 * misrepresent the shop's actual inventory.
 */
@Singleton
class DataSeeder @Inject constructor(private val expenseDao: ExpenseDao) {

    suspend fun seedDefaultExpenseCategoriesIfEmpty() {
        if (expenseDao.categoryCount() > 0) return
        val defaults = listOf(
            "দোকান ভাড়া" to "Shop Rent",
            "বিদ্যুৎ বিল" to "Electricity Bill",
            "কর্মচারীর বেতন" to "Employee Salary",
            "চা-নাস্তা" to "Tea & Snacks",
            "যাতায়াত" to "Transportation",
            "মেরামত" to "Maintenance",
            "অন্যান্য খরচ" to "Other Expenses"
        )
        defaults.forEach { (bn, en) ->
            expenseDao.upsertCategory(
                ExpenseCategoryEntity(
                    id = IdGenerator.newId(), nameBn = bn, nameEn = en, isCustom = false,
                    createdAt = DateUtil.now(), syncStatus = SyncStatus.PENDING
                )
            )
        }
    }
}
