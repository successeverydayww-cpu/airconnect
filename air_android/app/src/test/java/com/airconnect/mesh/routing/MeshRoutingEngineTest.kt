package com.airconnect.mesh.routing

import com.airconnect.mesh.routing.MeshRoutingEngine.PayloadKind
import org.junit.Assert.assertEquals
import org.junit.Test

class MeshRoutingEngineTest {
    private val engine = MeshRoutingEngine()
    private fun c(type: RouteType, live: Boolean = true, hops: Int = 1, latency: Long = 50) =
        RouteCandidate(type, peerReachable = true, continuous = live, hopCount = hops, estimatedLatencyMs = latency)

    @Test fun directBeatsInternet() = assertEquals(RouteType.DIRECT_LAN, engine.choose(listOf(c(RouteType.ONLINE), c(RouteType.DIRECT_LAN)), PayloadKind.VOICE))
    @Test fun awareBeatsDirectGroup() = assertEquals(RouteType.WIFI_AWARE, engine.choose(listOf(c(RouteType.WIFI_DIRECT), c(RouteType.WIFI_AWARE)), PayloadKind.VOICE))
    @Test fun airgateCarriesWideVoice() = assertEquals(RouteType.AIRGATE, engine.choose(listOf(c(RouteType.AIRGATE, hops = 8)), PayloadKind.VOICE))
    @Test fun interruptedVoiceNeverPretendsConnected() = assertEquals(RouteType.UNAVAILABLE, engine.choose(listOf(c(RouteType.LOCAL_MESH, live = false)), PayloadKind.VOICE))
    @Test fun interruptedMessageQueues() = assertEquals(RouteType.QUEUED, engine.choose(listOf(c(RouteType.LOCAL_MESH, live = false)), PayloadKind.MESSAGE))
}
