package com.fixibleit.onedesk.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.fixibleit.onedesk.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(user: UserEntity)

    @Update
    suspend fun update(user: UserEntity)

    @Query("SELECT * FROM users WHERE isActive = 1 ORDER BY createdAt ASC")
    fun observeActiveUsers(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE isActive = 0 AND isDeclined = 0 ORDER BY createdAt ASC")
    fun observePendingRequests(): Flow<List<UserEntity>>

    @Query("SELECT COUNT(*) FROM users WHERE isActive = 1")
    suspend fun activeUserCount(): Int

    @Query("SELECT COUNT(*) FROM users")
    suspend fun totalUserCount(): Int

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): UserEntity?

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getByEmail(email: String): UserEntity?
}
