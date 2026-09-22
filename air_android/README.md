# AirConnect AirNode for Android

Milestone 1 scaffold for a software-only AirNode. This is additive and does not alter the existing PWA, online calls, or v132 QR hotspot calls.

Implemented foundations:
1. Android foreground connected-device service.
2. Capability-declared Wi-Fi Direct, Wi-Fi Aware, and BLE permissions.
3. Deterministic route engine with a hard rule that interrupted paths can queue messages but never claim a live call.
4. Encrypted-envelope model with expiry and hop limits.
5. Long-term identity generated inside Android Keystore.
6. Transport gates that refuse data before authenticated handshakes.

Next implementation gates:
1. Noise XX authenticated handshake and key verification.
2. Wi-Fi Aware discovery driver with Wi-Fi Direct fallback.
3. Room-backed store-and-forward queue.
4. Instrumented two-phone tests.

The repository environment currently has no JDK or Android SDK, so this scaffold must be compiled in Android Studio or Android CI before installation. No APK is claimed yet.
