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
            // First time this device has seen this account. If nobody at all has
            // signed up yet, this is the founding OWNER (bootstrap). Otherwise the
            // user has to go through the Create Account request flow - refuse here
            // so a stranger with only a Firebase Auth account can't walk in.
            if (userDao.totalUserCount() == 0) {
                val now = DateUtil.now()
                val newUser = UserEntity(
                    id = result.uid, name = result.email.substringBefore("@"), mobile = "",
                    email = result.email, role = UserRole.OWNER, isActive = true, isDeclined = false,
                    createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
                )
                userDao.upsert(newUser)
                syncEnqueuer.enqueue("User", newUser.id, EntityMappers.toMap(newUser), SyncOperation.CREATE)
                newUser
            } else {
                authDataSource.signOut()
                return@try AuthOutcome.Error("Account not recognised on this business. Please tap Create Account to request access.")
            }
        }
        if (user.isDeclined) {
            authDataSource.signOut()
            return@try AuthOutcome.Error("Your access request was declined by the owner.")
        }
        if (!user.isActive) {
            authDataSource.signOut()
            return@try AuthOutcome.Error("Your account is awaiting admin approval.")
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
    /**
     * Self-service sign-up from the Login screen. Two paths:
     *
     * 1. First-ever user for this business (no local users at all) → signed up as
     *    the founding OWNER and logged in immediately. This is the only way to
     *    bootstrap the shop without a Firebase Console detour.
     *
     * 2. Business already has users → the Firebase Auth account is created, but the
     *    Room/Firestore user doc is stored as isActive=false. The user is signed
     *    out immediately and shown "Awaiting admin approval". The owner sees the
     *    request under Settings → Manage Users → Pending Requests with
     *    Accept / Decline buttons.
     */
    suspend fun signUpOrRequestAccess(name: String, mobile: String, email: String, password: String): AuthOutcome {
        val isFoundingOwner = userDao.totalUserCount() == 0
        return try {
            val result = authDataSource.createAccount(email, password)
            val now = DateUtil.now()
            val user = UserEntity(
                id = result.uid,
                name = name.ifBlank { email.substringBefore("@") }, mobile = mobile, email = email,
                role = if (isFoundingOwner) UserRole.OWNER else UserRole.STAFF,
                isActive = isFoundingOwner,
                isDeclined = false,
                createdAt = now, updatedAt = now, syncStatus = SyncStatus.PENDING
            )
            userDao.upsert(user)
            syncEnqueuer.enqueue("User", user.id, EntityMappers.toMap(user), SyncOperation.CREATE)
            if (isFoundingOwner) {
                auditLogger.log("User", user.id, "SIGNUP_FOUNDING_OWNER", user.id, null, EntityMappers.toMap(user).toString())
                settingsRepository.setSessionUserId(user.id)
                AuthOutcome.Success(user)
            } else {
                auditLogger.log("User", user.id, "ACCESS_REQUESTED", user.id, null, EntityMappers.toMap(user).toString())
                // Firebase Auth signs the new user in automatically; sign out so they
                // can't use the app until the owner accepts the request.
                authDataSource.signOut()
                AuthOutcome.Error("Account request sent. The owner will review it from Settings → Manage Users.")
            }
        } catch (t: Throwable) {
            AuthOutcome.Error(t.message ?: "Could not create the account.")
        }
    }

    /** Owner-only: approve a pending request. Sets isActive=true + syncs to Firestore. */
    suspend fun approveAccessRequest(user: UserEntity, approvedByUserId: String) {
        val updated = user.copy(isActive = true, isDeclined = false, updatedAt = DateUtil.now(), syncStatus = SyncStatus.PENDING)
        userDao.update(updated)
        syncEnqueuer.enqueue("User", updated.id, EntityMappers.toMap(updated), SyncOperation.UPDATE)
        auditLogger.log("User", updated.id, "APPROVE", approvedByUserId, EntityMappers.toMap(user).toString(), EntityMappers.toMap(updated).toString())
    }

    /** Owner-only: permanently dismiss a pending request. The user can never log in. */
    suspend fun declineAccessRequest(user: UserEntity, declinedByUserId: String) {
        val updated = user.copy(isActive = false, isDeclined = true, updatedAt = DateUtil.now(), syncStatus = SyncStatus.PENDING)
        userDao.update(updated)
        syncEnqueuer.enqueue("User", updated.id, EntityMappers.toMap(updated), SyncOperation.UPDATE)
        auditLogger.log("User", updated.id, "DECLINE", declinedByUserId, EntityMappers.toMap(user).toString(), EntityMappers.toMap(updated).toString())
    }

    fun observePendingRequests() = userDao.observePendingRequests()

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
