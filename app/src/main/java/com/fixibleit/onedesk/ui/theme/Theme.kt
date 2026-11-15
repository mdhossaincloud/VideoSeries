package com.fixibleit.onedesk.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

/**
 * App opens in light mode by default (business requirement); dark mode is an explicit
 * user choice persisted in SettingsRepository, never the system default.
 */
private val LightColors: ColorScheme = lightColorScheme(
    primary = NavyBase,
    onPrimary = ElegantWhite,
    primaryContainer = NavySurfaceTint,
    onPrimaryContainer = NavyDeep,
    secondary = GoldRoyal,
    onSecondary = NavyDeep,
    secondaryContainer = GoldSoft,
    onSecondaryContainer = NavyDeep,
    tertiary = InfoBlue,
    onTertiary = ElegantWhite,
    background = ElegantWhite,
    onBackground = NavyDeep,
    surface = ElegantWhite,
    onSurface = NavyDeep,
    surfaceVariant = WarmGrayLight,
    onSurfaceVariant = NavyBase,
    outline = WarmGrayDark,
    error = DangerRed,
    onError = ElegantWhite
)

private val DarkColors: ColorScheme = darkColorScheme(
    primary = GoldRoyal,
    onPrimary = NavyDeep,
    primaryContainer = NavyLight,
    onPrimaryContainer = GoldSoft,
    secondary = GoldSoft,
    onSecondary = NavyDeep,
    secondaryContainer = DarkSurfaceElevated,
    onSecondaryContainer = GoldSoft,
    tertiary = InfoBlue,
    onTertiary = ElegantWhite,
    background = DarkSurface,
    onBackground = ElegantWhite,
    surface = DarkSurfaceAlt,
    onSurface = ElegantWhite,
    surfaceVariant = DarkSurfaceElevated,
    onSurfaceVariant = GoldSoft,
    outline = WarmGrayDark,
    error = DangerRed,
    onError = ElegantWhite
)

@Composable
fun OneDeskTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colorScheme,
        typography = OneDeskTypography,
        shapes = OneDeskShapes,
        content = content
    )
}
