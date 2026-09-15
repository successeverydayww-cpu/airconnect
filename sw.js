/* AirConnect service worker — incoming call notifications, ring even when the app is closed */
const FN = 'https://superagent-ccb075d2.base44.app/functions/airconnectTrunk';
const LOG = (msg) => fetch(FN, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({act:'log', msg: '[SW] ' + msg})});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (err) { d = {}; }
  LOG('push received: incoming call from +' + (d.from || '?'));
  e.waitUntil((async () => {
    await self.registration.showNotification('📞 Incoming AirConnect call', {
      body: (d.fromName || 'Someone') + ' is calling you  ·  +' + (d.from || ''),
      tag: 'aicall-' + (d.from || 'x'),
      requireInteraction: true,
      vibrate: [400, 200, 400, 200, 400],
      data: { from: d.from },
      actions: [
        { action: 'accept', title: '✅ Accept' },
        { action: 'decline', title: '❌ Decline' }
      ]
    });
  })());
});

self.addEventListener('notificationclick', e => {
  const from = (e.notification.data && e.notification.data.from) || '';
  e.notification.close();
  LOG('notification clicked (' + e.action + ') for +' + from);
  e.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.indexOf('caller.html') !== -1) {
        await c.focus();
        c.postMessage({ incoming: from });
        return;
      }
    }
    await clients.openWindow('caller.html?answer=' + from);
  })());
});

self.addEventListener('pushsubscriptionchange', e => {
  LOG('subscription changed — page will re-subscribe on next open');
});

const SHELL = ['./', './caller.html', './agent.html', './manifest.json', './privacy.html', './icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open('airconnect-v3').then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== 'airconnect-v3').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(m => {
      const net = fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open('airconnect-v3').then(c => c.put(e.request, cp)).catch(() => {});
        return r;
      }).catch(() => m);
      return m || net;
    })
  );
});
