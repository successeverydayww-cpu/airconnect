/* AirConnect service worker v80: ultra-strong auto-update — every app open fetches the TRUE latest shell from origin (cache-bust query kills browser + CDN staleness), offline still works */
const CACHE = 'airconnect-v109';
const SHELL = ['./caller.html', './caller5.html', './manifest.json', './icon-192.png', './icon-512.png', './qrcode.min.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'AC_PURGE') { try { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k))))); } catch (x) {} }
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.includes('functions/')) return; // never cache the API
  if (url.origin !== location.origin) return;                                     // let CDNs be
  const isNav = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html');
  if (isNav) { /* v80: unique URL + no-store => origin always answers with the newest HTML, in seconds */
    const bust = new URL(e.request.url);
    bust.searchParams.set('acsw', Date.now());
    e.respondWith(
      fetch(bust, { cache: 'no-store' }).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return r;
      }).catch(() => caches.match(e.request).then((m) => m || caches.match('./caller.html')))
    );
    return;
  }
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
  if (what === 'missed_call') {
    e.waitUntil(self.registration.showNotification('Missed AirConnect call', {
      body: (d.fromName || ('+' + (d.from || ''))) + ' called you', tag: 'miss-' + (d.from || 'x'), data: { url: './caller.html' }
    }));
  }
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
