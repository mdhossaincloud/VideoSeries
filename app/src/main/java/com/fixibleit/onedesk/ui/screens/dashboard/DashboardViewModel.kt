package com.fixibleit.onedesk.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fixibleit.onedesk.data.repository.DashboardRepository
import com.fixibleit.onedesk.data.repository.DashboardSnapshot
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    dashboardRepository: DashboardRepository
) : ViewModel() {

    val snapshot: StateFlow<DashboardSnapshot?> = dashboardRepository.observeSnapshot()
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)
}
