package com.fixibleit.onedesk.util

import java.util.UUID

/** Every record and transaction gets one of these up front, offline, so it is already the
 * Firestore document id and duplicate-safe if the sync queue retries it. */
object IdGenerator {
    fun newId(): String = UUID.randomUUID().toString()
}
