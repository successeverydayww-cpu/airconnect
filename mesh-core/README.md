# AirConnect Hybrid Mesh Core

This directory starts the transport-independent routing layer for AirConnect.
It does not replace the existing online or v132 QR hotspot call paths.

Route priority:
1. Direct LAN or hotspot, zero data.
2. Continuous local mesh, zero data.
3. AirGate private backhaul for wider mesh coverage.
4. Existing internet call path.
5. Store-and-forward queue for non-live messages only.

A live voice or video call is never labeled connected unless a continuous path exists.
Relay nodes will route encrypted envelopes and must never receive plaintext message or media keys.

Run tests:

```sh
node mesh-core/test/route-engine.test.js
```
