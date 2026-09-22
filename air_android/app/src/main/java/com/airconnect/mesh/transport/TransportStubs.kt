package com.airconnect.mesh.transport

import com.airconnect.mesh.api.MeshEnvelope
import com.airconnect.mesh.routing.RouteCandidate
import com.airconnect.mesh.routing.RouteType
import com.airconnect.mesh.routing.TransportLink

/** Drivers are intentionally closed until permission, identity, and authenticated-handshake gates pass. */
abstract class GatedTransport(final override val type: RouteType) : TransportLink {
    @Volatile protected var authenticated = false
    fun markAuthenticated() { authenticated = true }
    override suspend fun discover(): List<RouteCandidate> = emptyList()
    override suspend fun send(envelope: MeshEnvelope): Result<Unit> =
        if (authenticated) Result.failure(NotImplementedError("driver pending"))
        else Result.failure(SecurityException("authenticated mesh handshake required"))
    override suspend fun close() { authenticated = false }
}

class WifiAwareTransport : GatedTransport(RouteType.WIFI_AWARE)
class WifiDirectTransport : GatedTransport(RouteType.WIFI_DIRECT)
class OnlineTransport : GatedTransport(RouteType.ONLINE)
