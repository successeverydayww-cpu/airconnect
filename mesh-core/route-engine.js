'use strict';

/* AirConnect Hybrid Mesh route engine.
   Chooses the safest usable path without changing the existing call stack. */
const ROUTE = Object.freeze({
  ONLINE: 'online',
  DIRECT_LAN: 'direct_lan',
  LOCAL_MESH: 'local_mesh',
  AIRGATE: 'airgate',
  QUEUED: 'queued',
  UNAVAILABLE: 'unavailable'
});

function bool(v) { return v === true; }
function finite(v, fallback) { return Number.isFinite(v) ? v : fallback; }

function chooseRoute(state, kind = 'voice') {
  const s = state || {};
  const live = kind === 'voice' || kind === 'video';
  const direct = bool(s.sameLan) && bool(s.peerReachable);
  const mesh = bool(s.meshAvailable) && finite(s.meshHops, Infinity) > 0;
  const gate = mesh && bool(s.airGateReachable);

  // Local direct paths use no data and have the least latency.
  if (direct) return decision(ROUTE.DIRECT_LAN, 'zero_data', 10);

  // Live media needs a continuous path. AirGate is preferred for wider reach.
  if (live && gate && bool(s.meshContinuous)) {
    return decision(ROUTE.AIRGATE, 'private_backhaul', finite(s.estimatedLatencyMs, 180));
  }
  if (live && mesh && bool(s.meshContinuous) && finite(s.meshHops, 99) <= 4) {
    return decision(ROUTE.LOCAL_MESH, 'zero_data', finite(s.estimatedLatencyMs, 120));
  }

  // Keep today's proven worldwide calling as the dependable fallback.
  if (bool(s.internetReachable)) {
    return decision(ROUTE.ONLINE, 'internet', finite(s.estimatedLatencyMs, 220));
  }

  // Messages can survive broken routes and forward later. Calls cannot.
  if (!live && (mesh || bool(s.storeAndForwardCapable))) {
    return decision(ROUTE.QUEUED, 'store_and_forward', null);
  }
  return decision(ROUTE.UNAVAILABLE, 'no_continuous_path', null);
}

function decision(route, transport, latencyMs) {
  return Object.freeze({ route, transport, latencyMs });
}

module.exports = { ROUTE, chooseRoute };
