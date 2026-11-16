package com.fixibleit.onedesk.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.model.UserRole

/** Cached locally so role checks and the "up to four users" limit work fully offline. */
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val mobile: String,
    val email: String,
    val role: UserRole,
    val isActive: Boolean = true,
    // true means the admin declined this account request; it lives on so declined users
    // don't silently reappear in the pending list after sync.
    @ColumnInfo(defaultValue = "0")
    val isDeclined: Boolean = false,
    val createdAt: Long,
    val updatedAt: Long,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)
