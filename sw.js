const CACHE_NAME = 'global-route-v127';

// Caches this app's shell so it opens with no signal.
// Scoped to 'global-route-' keys only — Charter's cache is never touched.
const APP_SHELL = ['/global-route/', '/global-route/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => Promise.all(APP_SHELL.map(u => c.add(u).catch(() => {}))))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('global-route-') && k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Do NOT cache or intercept v2 app
  if (e.request.url.includes('/v2/')) return;
  // Charter is a separate application sharing this domain — never intercept or cache it
  if (e.request.url.includes('/charter/')) return;
  
  const url = new URL(e.request.url);
  
  // App shell: always try the network first so crews get the newest build,
  // but keep a copy so the app still opens when there is no signal.
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname === '/global-route' || url.pathname === '/global-route/') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(resp => {
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() =>
        caches.match(e.request).then(hit => hit || caches.match('/global-route/index.html'))
      )
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
