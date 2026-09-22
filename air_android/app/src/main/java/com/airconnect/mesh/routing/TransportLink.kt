package com.airconnect.mesh.routing

import com.airconnect.mesh.api.MeshEnvelope

interface TransportLink {
    val type: RouteType
    suspend fun discover(): List<RouteCandidate>
    suspend fun send(envelope: MeshEnvelope): Result<Unit>
    suspend fun close()
}
