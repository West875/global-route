const CACHE_NAME = 'global-route-v56';

// Only cache external CDN libraries — NEVER cache index.html
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Do NOT cache or intercept v2 app
  if (e.request.url.includes('/v2/')) return;
  
  const url = new URL(e.request.url);
  
  // NEVER cache the main HTML — always fetch fresh
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname === '/global-route' || url.pathname === '/global-route/') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Cache external CDN resources (libraries) — they never change
  if (url.hostname !== location.hostname) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return resp;
        });
      })
    );
    return;
  }
  
  // Everything else: network first, cache fallback
  e.respondWith(
    fetch(e.request).then(resp => {
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
