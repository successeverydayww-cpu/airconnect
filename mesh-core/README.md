# AirConnect online-first route engine

This source-only routing scaffold is not deployed in the web app. It now follows the production policy: online calls and video require an internet connection; text messages may queue locally without one and send when internet returns. Direct LAN, hotspot, and mesh voice routes are not selected. There is no claim of offline voice calling.

Run regression checks from the AirConnect repository root:

```sh
node mesh-core/test/route-engine.test.js
node tests/online_first.test.cjs
```
