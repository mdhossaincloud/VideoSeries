package com.fixibleit.onedesk.util

import java.text.NumberFormat
import java.util.Locale

/** Bangladeshi Taka formatting used consistently across every screen and report. */
object Money {
    private val formatter: NumberFormat = NumberFormat.getNumberInstance(Locale.US).apply {
        maximumFractionDigits = 2
        minimumFractionDigits = 0
    }

    fun format(amountBDT: Double): String = "৳ ${formatter.format(amountBDT)}"

    fun formatKg(kg: Double): String =
        if (kg == kg.toLong().toDouble()) "${kg.toLong()} kg" else String.format(Locale.US, "%.2f kg", kg)
}
