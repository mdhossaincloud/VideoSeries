package com.fixibleit.onedesk.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.repository.AuthOutcome
import com.fixibleit.onedesk.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class AuthMode { SIGN_IN, SIGN_UP }

data class LoginUiState(
    val mode: AuthMode = AuthMode.SIGN_IN,
    val name: String = "",
    val mobile: String = "",
    val email: String = "",
    val password: String = "",
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun setMode(mode: AuthMode) { _uiState.value = _uiState.value.copy(mode = mode, errorMessage = null) }
    fun onNameChange(v: String) { _uiState.value = _uiState.value.copy(name = v, errorMessage = null) }
    fun onMobileChange(v: String) { _uiState.value = _uiState.value.copy(mobile = v, errorMessage = null) }
    fun onEmailChange(v: String) { _uiState.value = _uiState.value.copy(email = v, errorMessage = null) }
    fun onPasswordChange(v: String) { _uiState.value = _uiState.value.copy(password = v, errorMessage = null) }

    fun submit(onSuccess: () -> Unit) {
        val state = _uiState.value
        if (state.email.isBlank() || state.password.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Please enter both email and password.")
            return
        }
        if (state.mode == AuthMode.SIGN_UP && state.password.length < 6) {
            _uiState.value = state.copy(errorMessage = "Password must be at least 6 characters.")
            return
        }
        _uiState.value = state.copy(isSubmitting = true, errorMessage = null)
        viewModelScope.launch {
            val outcome = if (state.mode == AuthMode.SIGN_IN) {
                authRepository.signIn(state.email.trim(), state.password)
            } else {
                authRepository.signUpOrRequestAccess(state.name.trim(), state.mobile.trim(), state.email.trim(), state.password)
            }
            when (outcome) {
                is AuthOutcome.Success -> {
                    _uiState.value = _uiState.value.copy(isSubmitting = false)
                    onSuccess()
                }
                is AuthOutcome.Error -> {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, errorMessage = outcome.message)
                }
            }
        }
    }
}
