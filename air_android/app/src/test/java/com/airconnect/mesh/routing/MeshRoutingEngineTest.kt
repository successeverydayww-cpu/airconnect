package com.airconnect.mesh.routing

import com.airconnect.mesh.routing.MeshRoutingEngine.PayloadKind
import org.junit.Assert.assertEquals
import org.junit.Test

class MeshRoutingEngineTest {
    private val engine = MeshRoutingEngine()
    private fun c(type: RouteType, live: Boolean = true, hops: Int = 1, latency: Long = 50) =
        RouteCandidate(type, peerReachable = true, continuous = live, hopCount = hops, estimatedLatencyMs = latency)

    @Test fun onlineVoiceBeatsDirectLan() = assertEquals(RouteType.ONLINE, engine.choose(listOf(c(RouteType.ONLINE), c(RouteType.DIRECT_LAN)), PayloadKind.VOICE))
    @Test fun offlineLanVoiceIsUnavailable() = assertEquals(RouteType.UNAVAILABLE, engine.choose(listOf(c(RouteType.DIRECT_LAN)), PayloadKind.VOICE))
    @Test fun offlineMeshVoiceIsUnavailable() = assertEquals(RouteType.UNAVAILABLE, engine.choose(listOf(c(RouteType.LOCAL_MESH)), PayloadKind.VOICE))
    @Test fun offlineAirgateVideoIsUnavailable() = assertEquals(RouteType.UNAVAILABLE, engine.choose(listOf(c(RouteType.AIRGATE)), PayloadKind.VIDEO))
    @Test fun interruptedOnlineVoiceIsUnavailable() = assertEquals(RouteType.UNAVAILABLE, engine.choose(listOf(c(RouteType.ONLINE, live = false)), PayloadKind.VOICE))
    @Test fun offlineTextQueues() = assertEquals(RouteType.QUEUED, engine.choose(listOf(c(RouteType.LOCAL_MESH, live = false)), PayloadKind.MESSAGE))
    @Test fun onlineTextSends() = assertEquals(RouteType.ONLINE, engine.choose(listOf(c(RouteType.ONLINE)), PayloadKind.MESSAGE))
}
