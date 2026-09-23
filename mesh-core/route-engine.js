'use strict';

/* AirConnect online-first routing. Offline use is limited to queued text.
   There is deliberately no zero-data call or LAN/mesh live-media path. */
const ROUTE = Object.freeze({
  ONLINE: 'online',
  QUEUED: 'queued',
  UNAVAILABLE: 'unavailable'
});

function chooseRoute(state, kind = 'voice') {
  const s = state || {};
  if (s.internetReachable === true) {
    return Object.freeze({ route: ROUTE.ONLINE, transport: 'internet', latencyMs: Number.isFinite(s.estimatedLatencyMs) ? s.estimatedLatencyMs : 220 });
  }
  if (kind === 'message') {
    return Object.freeze({ route: ROUTE.QUEUED, transport: 'store_and_forward', latencyMs: null });
  }
  return Object.freeze({ route: ROUTE.UNAVAILABLE, transport: 'internet_required', latencyMs: null });
}

module.exports = { ROUTE, chooseRoute };
