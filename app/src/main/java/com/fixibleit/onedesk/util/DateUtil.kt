package com.fixibleit.onedesk.util

import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

object DateUtil {
    val zone: ZoneId = ZoneId.systemDefault()

    fun now(): Long = System.currentTimeMillis()

    fun startOfDay(epochMillis: Long = now()): Long =
        Instant.ofEpochMilli(epochMillis).atZone(zone).toLocalDate()
            .atStartOfDay(zone).toInstant().toEpochMilli()

    fun endOfDay(epochMillis: Long = now()): Long =
        LocalDateTime.of(
            Instant.ofEpochMilli(epochMillis).atZone(zone).toLocalDate(),
            LocalTime.MAX
        ).atZone(zone).toInstant().toEpochMilli()

    fun startOfWeek(epochMillis: Long = now()): Long {
        val date = Instant.ofEpochMilli(epochMillis).atZone(zone).toLocalDate()
        val monday = date.minusDays((date.dayOfWeek.value - 1).toLong())
        return monday.atStartOfDay(zone).toInstant().toEpochMilli()
    }

    fun startOfMonth(epochMillis: Long = now()): Long {
        val date = Instant.ofEpochMilli(epochMillis).atZone(zone).toLocalDate().withDayOfMonth(1)
        return date.atStartOfDay(zone).toInstant().toEpochMilli()
    }

    fun startOfPreviousDay(epochMillis: Long = now()): Long =
        startOfDay(epochMillis) - 1

    private val displayFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")
    private val dateOnlyFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy")

    fun formatDateTime(epochMillis: Long): String =
        Instant.ofEpochMilli(epochMillis).atZone(zone).format(displayFormatter)

    fun formatDate(epochMillis: Long): String =
        Instant.ofEpochMilli(epochMillis).atZone(zone).format(dateOnlyFormatter)

    fun isSameDay(a: Long, b: Long): Boolean =
        Instant.ofEpochMilli(a).atZone(zone).toLocalDate() == Instant.ofEpochMilli(b).atZone(zone).toLocalDate()
}
