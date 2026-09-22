package com.airconnect.mesh.api

data class PeerIdentity(val airId: String, val signingPublicKey: ByteArray)

data class MeshEnvelope(
    val version: Int = 1,
    val messageId: String,
    val senderKeyId: String,
    val recipientKeyId: String,
    val createdAtEpochMs: Long,
    val expiresAtEpochMs: Long,
    val hopLimit: Int,
    val nonce: ByteArray,
    val ciphertext: ByteArray
) {
    init {
        require(messageId.isNotBlank())
        require(hopLimit in 0..32)
        require(expiresAtEpochMs > createdAtEpochMs)
        require(ciphertext.isNotEmpty())
    }
}
