package com.airconnect.mesh.routing

/* Dormant Android scaffold: live calls and video require internet.
   Only text messages may be queued without internet. */
class MeshRoutingEngine {
    enum class PayloadKind { MESSAGE, VOICE, VIDEO }

    fun choose(candidates: Collection<RouteCandidate>, kind: PayloadKind): RouteType {
        if (candidates.any { it.type == RouteType.ONLINE && it.peerReachable && it.continuous }) {
            return RouteType.ONLINE
        }
        return if (kind == PayloadKind.MESSAGE) RouteType.QUEUED else RouteType.UNAVAILABLE
    }
}
