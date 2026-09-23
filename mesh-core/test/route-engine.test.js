'use strict';
const assert = require('node:assert/strict');
const { ROUTE, chooseRoute } = require('../route-engine');

const cases = [
  [{ sameLan:true, peerReachable:true, internetReachable:true }, 'voice', ROUTE.ONLINE],
  [{ sameLan:true, peerReachable:true }, 'voice', ROUTE.UNAVAILABLE],
  [{ meshAvailable:true, meshHops:2, meshContinuous:true }, 'voice', ROUTE.UNAVAILABLE],
  [{ meshAvailable:true, meshHops:8, meshContinuous:true, airGateReachable:true }, 'video', ROUTE.UNAVAILABLE],
  [{ internetReachable:true }, 'voice', ROUTE.ONLINE],
  [{ internetReachable:true }, 'message', ROUTE.ONLINE],
  [{ sameLan:true, peerReachable:true }, 'message', ROUTE.QUEUED],
  [{}, 'message', ROUTE.QUEUED],
  [{}, 'voice', ROUTE.UNAVAILABLE],
  [{}, 'video', ROUTE.UNAVAILABLE],
  [{}, 'file', ROUTE.UNAVAILABLE]
];
for (const [state, kind, expected] of cases) {
  assert.equal(chooseRoute(state, kind).route, expected, JSON.stringify({state,kind}));
}
assert.equal(chooseRoute({ sameLan:true, peerReachable:true }, 'voice').transport, 'internet_required');
console.log(`AirConnect online-first routing: ${cases.length + 1} assertions passed`);
