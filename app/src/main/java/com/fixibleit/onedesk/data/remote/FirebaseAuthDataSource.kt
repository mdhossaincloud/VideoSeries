package com.fixibleit.onedesk.data.remote

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

data class AuthResult(val uid: String, val email: String)

@Singleton
class FirebaseAuthDataSource @Inject constructor(
    private val auth: FirebaseAuth
) {
    val currentUid: String? get() = auth.currentUser?.uid
    val currentEmail: String? get() = auth.currentUser?.email

    fun observeAuthState(): Flow<AuthResult?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { fa ->
            val user = fa.currentUser
            trySend(user?.let { AuthResult(it.uid, it.email.orEmpty()) })
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun signIn(email: String, password: String): AuthResult {
        val result = auth.signInWithEmailAndPassword(email, password).await()
        val user = requireNotNull(result.user) { "Sign-in succeeded but no user was returned" }
        return AuthResult(user.uid, user.email.orEmpty())
    }

    /** Owner-only: provisioning a new staff/owner account (max 4 users, enforced by UserRepository). */
    suspend fun createAccount(email: String, password: String): AuthResult {
        val result = auth.createUserWithEmailAndPassword(email, password).await()
        val user = requireNotNull(result.user) { "Account creation succeeded but no user was returned" }
        return AuthResult(user.uid, user.email.orEmpty())
    }

    suspend fun sendPasswordReset(email: String) {
        auth.sendPasswordResetEmail(email).await()
    }

    fun signOut() = auth.signOut()
}
