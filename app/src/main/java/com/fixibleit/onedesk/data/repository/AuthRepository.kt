package com.fixibleit.onedesk.data.repository

import com.fixibleit.onedesk.data.local.dao.UserDao
import com.fixibleit.onedesk.data.local.entity.UserEntity
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.model.UserRole
import com.fixibleit.onedesk.data.remote.EntityMappers
import com.fixibleit.onedesk.data.remote.FirebaseAuthDataSource
import com.fixibleit.onedesk.data.sync.SyncEnqueuer
import com.fixibleit.onedesk.util.DateUtil
import com.fixibleit.onedesk.util.IdGenerator
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

sealed class AuthOutcome {
    data class Success(val user: UserEntity) : AuthOutcome()
    data class Error(val message: String) : AuthOutcome()
}

const val MAX_USERS_PER_BUSINESS = 4

@Singleton
class AuthRepository @Inject constructor(
    private val authDataSource: FirebaseAuthDataSource,
    private val userDao: UserDao,
    private val settingsRepository: SettingsRepository,
    private val syncEnqueuer: SyncEnqueuer,
    private val auditLogger: AuditLogger
) {
    val currentUser: Flow<UserEntity?> = settingsRepository.sessionUserId.map { userId ->
        userId?.let { userDao.getById(it) }
    }

    /** Convenience for ViewModel actions that just need the acting user's id, without
     * collecting the whole currentUser Flow at every call site. */
    suspend fun currentUserIdOrNull(): String? = currentUser.first()?.id

    suspend fun signIn(email: String, password: String): AuthOutcome = try {
        val result = authDataSource.signIn(email, password)
        val local = userDao.getByEmail(result.email) ?: userDao.getById(result.uid)
        val user = if (local != null) {
            local
        } else {
            // First time this device sees this user. If no active user exists in this
            // business yet, this one is the founding OWNER so the shop can be set up
            // without anyone having to hand-edit Firestore. Everyone created after that
            // from Settings -> Users starts as the role the owner picked.
            val isFirstUser = userDao.activeUserCount() == 0
            val now = DateUtil.now()
            val newUser = UserEntity(
                id = result.uid, name = result.email.substringBefore("@"), mobile = "",
                email = result.email,
                role = if (isFirstUser) UserRole.OWNER else UserRole.STAFF,
                createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
            )
            userDao.upsert(newUser)
            syncEnqueuer.enqueue("User", newUser.id, EntityMappers.toMap(newUser), SyncOperation.CREATE)
            newUser
        }
        settingsRepository.setSessionUserId(user.id)
        AuthOutcome.Success(user)
    } catch (t: Throwable) {
        AuthOutcome.Error(t.message ?: "Sign-in failed. Please check your connection and try again.")
    }

    suspend fun signOut() {
        authDataSource.signOut()
        settingsRepository.setSessionUserId(null)
    }

    /** Owner-only. Enforces the "up to four users" business rule before creating the Firebase
     * Auth account, so a failed limit check never leaves an orphaned auth user behind. */
    /** Public self-service sign-up used from the Login screen. If the business has
     *  no active user yet, the person signing up is the founding OWNER so the shop
     *  can be set up with zero Firebase Console steps. Any subsequent self-signup is
     *  refused - more staff must be added by the owner from Settings. */
    suspend fun signUpFirstOwner(name: String, mobile: String, email: String, password: String): AuthOutcome {
        if (userDao.activeUserCount() > 0) {
            return AuthOutcome.Error("An owner already exists for this business. Ask the owner to add you from Settings → Users.")
        }
        return try {
            val result = authDataSource.createAccount(email, password)
            val now = DateUtil.now()
            val user = UserEntity(
                id = result.uid, name = name.ifBlank { email.substringBefore("@") }, mobile = mobile,
                email = email, role = UserRole.OWNER, createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
            )
            userDao.upsert(user)
            syncEnqueuer.enqueue("User", user.id, EntityMappers.toMap(user), SyncOperation.CREATE)
            auditLogger.log("User", user.id, "SIGNUP_FOUNDING_OWNER", user.id, null, EntityMappers.toMap(user).toString())
            settingsRepository.setSessionUserId(user.id)
            AuthOutcome.Success(user)
        } catch (t: Throwable) {
            AuthOutcome.Error(t.message ?: "Could not create the account.")
        }
    }

    suspend fun createStaffOrOwnerAccount(
        name: String,
        mobile: String,
        email: String,
        password: String,
        role: UserRole,
        performedByUserId: String
    ): AuthOutcome {
        if (userDao.activeUserCount() >= MAX_USERS_PER_BUSINESS) {
            return AuthOutcome.Error("This business already has the maximum of $MAX_USERS_PER_BUSINESS users.")
        }
        return try {
            val result = authDataSource.createAccount(email, password)
            val now = DateUtil.now()
            val user = UserEntity(
                id = result.uid, name = name, mobile = mobile, email = email, role = role,
                createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
            )
            userDao.upsert(user)
            syncEnqueuer.enqueue("User", user.id, EntityMappers.toMap(user), SyncOperation.CREATE)
            auditLogger.log("User", user.id, "CREATE", performedByUserId, null, EntityMappers.toMap(user).toString())
            AuthOutcome.Success(user)
        } catch (t: Throwable) {
            AuthOutcome.Error(t.message ?: "Could not create the account. Please check your connection.")
        }
    }

    suspend fun deactivateUser(user: UserEntity, performedByUserId: String) {
        val updated = user.copy(isActive = false, updatedAt = DateUtil.now(), syncStatus = SyncStatus.PENDING)
        userDao.update(updated)
        syncEnqueuer.enqueue("User", updated.id, EntityMappers.toMap(updated), SyncOperation.UPDATE)
        auditLogger.log("User", updated.id, "DEACTIVATE", performedByUserId, EntityMappers.toMap(user).toString(), EntityMappers.toMap(updated).toString())
    }

    fun observeActiveUsers() = userDao.observeActiveUsers()
}
