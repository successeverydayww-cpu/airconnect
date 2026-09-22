package com.airconnect.mesh

import android.app.Application
import com.airconnect.mesh.crypto.KeyManager

class AirMeshApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        KeyManager.ensureIdentity()
    }
}
