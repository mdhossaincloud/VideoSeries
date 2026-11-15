package com.fixibleit.onedesk.ui.common

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.fixibleit.onedesk.ui.theme.SuccessGreen
import com.fixibleit.onedesk.ui.theme.WarningAmber
import com.fixibleit.onedesk.ui.theme.DangerRed

/** Shown in Settings and on individual records: pending work never hides, and a failure is
 * never silent (spec section 8: "Pending / Synced / Failed indicators"). */
@Composable
fun SyncStatusBadge(pendingCount: Int, failedCount: Int, modifier: Modifier = Modifier) {
    val (label, color) = when {
        failedCount > 0 -> "$failedCount sync issue(s)" to DangerRed
        pendingCount > 0 -> "Syncing $pendingCount..." to WarningAmber
        else -> "All synced" to SuccessGreen
    }
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(50),
        color = color.copy(alpha = 0.12f)
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            color = color,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}
