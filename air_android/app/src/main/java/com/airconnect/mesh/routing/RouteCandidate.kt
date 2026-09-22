package com.airconnect.mesh.routing

data class RouteCandidate(
    val type: RouteType,
    val peerReachable: Boolean,
    val continuous: Boolean,
    val hopCount: Int = 0,
    val estimatedLatencyMs: Long = Long.MAX_VALUE,
    val metered: Boolean = false
)
