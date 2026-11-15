package com.fixibleit.onedesk.util

import org.json.JSONObject

/**
 * Sync-queue payloads are flat maps of primitives (String/Long/Double/Int/Boolean/null) -
 * every entity in this app is a flat Room row, so no nested-object support is needed.
 */
object JsonUtil {
    fun mapToJson(map: Map<String, Any?>): String {
        val obj = JSONObject()
        for ((k, v) in map) {
            if (v == null) obj.put(k, JSONObject.NULL) else obj.put(k, v)
        }
        return obj.toString()
    }

    fun jsonToMap(json: String): Map<String, Any?> {
        val obj = JSONObject(json)
        val result = LinkedHashMap<String, Any?>()
        val keys = obj.keys()
        while (keys.hasNext()) {
            val k = keys.next()
            val v = obj.get(k)
            result[k] = if (v == JSONObject.NULL) null else v
        }
        return result
    }
}
