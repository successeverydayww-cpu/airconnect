'use strict';
const assert = require('assert');
const { ROUTE, chooseRoute } = require('../route-engine');

const cases = [
  [{ sameLan:true, peerReachable:true, internetReachable:true }, 'voice', ROUTE.DIRECT_LAN],
  [{ meshAvailable:true, meshHops:2, meshContinuous:true }, 'voice', ROUTE.LOCAL_MESH],
  [{ meshAvailable:true, meshHops:8, meshContinuous:true, airGateReachable:true }, 'voice', ROUTE.AIRGATE],
  [{ internetReachable:true }, 'voice', ROUTE.ONLINE],
  [{ meshAvailable:true, meshHops:7, meshContinuous:false }, 'message', ROUTE.QUEUED],
  [{ storeAndForwardCapable:true }, 'message', ROUTE.QUEUED],
  [{}, 'voice', ROUTE.UNAVAILABLE]
];
for (const [state, kind, expected] of cases) {
  assert.strictEqual(chooseRoute(state, kind).route, expected, JSON.stringify({state,kind}));
}
assert.strictEqual(chooseRoute({ sameLan:true, peerReachable:true }, 'voice').transport, 'zero_data');
console.log(`AirConnect route engine: ${cases.length + 1} assertions passed`);
