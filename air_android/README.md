# AirConnect AirNode for Android (unreleased scaffold)

This is a source-only experiment, not a compiled or deployed app. Its routing policy matches AirConnect v141: voice and video need internet; without internet, only text messages may queue until reconnection. LAN, hotspot, Wi-Fi Aware, Wi-Fi Direct, BLE, local mesh, and AirGate must not initiate live calls or deliver offline messages.

Existing Keystore, encrypted-envelope, and transport-authentication models remain in the scaffold, but are not evidence of a tested Android product. This environment has no JDK or Android SDK, so these Kotlin tests require Android Studio or Android CI. No APK is claimed.
