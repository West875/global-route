// Self-destruct: clear all caches and unregister
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.matchAll())
      .then(clients => { clients.forEach(c => c.navigate(c.url)); })
      .then(() => self.registration.unregister())
  );
});
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request)); });
