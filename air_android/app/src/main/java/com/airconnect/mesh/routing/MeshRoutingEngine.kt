package com.airconnect.mesh.routing

class MeshRoutingEngine {
    enum class PayloadKind { MESSAGE, VOICE, VIDEO }

    fun choose(candidates: Collection<RouteCandidate>, kind: PayloadKind): RouteType {
        val live = kind != PayloadKind.MESSAGE
        val usable = candidates.filter { it.peerReachable }

        usable.firstOrNull { it.type == RouteType.DIRECT_LAN }?.let { return it.type }
        usable.filter { it.continuous && it.type == RouteType.WIFI_AWARE }
            .minByOrNull { it.estimatedLatencyMs }?.let { return it.type }
        usable.filter { it.continuous && it.type == RouteType.WIFI_DIRECT }
            .minByOrNull { it.estimatedLatencyMs }?.let { return it.type }
        usable.filter { it.continuous && it.type == RouteType.AIRGATE }
            .minByOrNull { it.estimatedLatencyMs }?.let { return it.type }
        usable.filter { it.continuous && it.type == RouteType.LOCAL_MESH && it.hopCount in 1..4 }
            .minByOrNull { it.estimatedLatencyMs }?.let { return it.type }
        usable.firstOrNull { it.type == RouteType.ONLINE }?.let { return it.type }

        return if (!live && candidates.any { it.type in setOf(RouteType.LOCAL_MESH, RouteType.QUEUED) }) {
            RouteType.QUEUED
        } else RouteType.UNAVAILABLE
    }
}
