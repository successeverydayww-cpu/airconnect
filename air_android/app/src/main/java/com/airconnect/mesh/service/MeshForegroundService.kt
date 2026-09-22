package com.airconnect.mesh.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.airconnect.mesh.routing.MeshRoutingEngine

class MeshForegroundService : Service() {
    private val routing = MeshRoutingEngine()

    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(CHANNEL, "AirConnect nearby network", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        val notification = NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentTitle("AirConnect AirNode")
            .setContentText("Ready to discover trusted nearby AirNodes")
            .setOngoing(true)
            .build()
        startForeground(1001, notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object { private const val CHANNEL = "airconnect_mesh" }
}
