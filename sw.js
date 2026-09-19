/* AirConnect service worker: offline shell + faster loads */
const CACHE = 'airconnect-v43';
const SHELL = ['./caller.html', './manifest.json', './icon-192.png', './icon-512.png', './qrcode.min.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || (url.pathname.includes('functions/'))) return; // never cache the API
  if (url.origin !== location.origin) return;                                     // let CDNs be
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match('./caller.html')))
  );
});
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) {}
  const what = d.what || '';
  if (what === 'incoming_call') {
    e.waitUntil(self.registration.showNotification('📞 Incoming AirConnect call', {
      body: (d.fromName || ('+' + (d.from || ''))) + ' is calling you',
      tag: 'call-' + (d.from || 'x'), requireInteraction: true, data: { url: './caller.html' }
    }));
  } else if (what === 'incoming_group_call') {
    e.waitUntil(self.registration.showNotification('👥📞 Group call', {
      body: (d.groupName || 'Your group') + ' — ' + (d.fromName || ('+' + (d.from || ''))) + ' is calling',
      tag: 'gcall-' + (d.from || 'x'), requireInteraction: true, data: { url: './caller.html' }
    }));
  }
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow('./caller.html');
  }));
});
