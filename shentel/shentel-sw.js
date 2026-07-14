const CACHE='shentel-v32';
const ASSETS=[
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install',e=>{
  // cache:'reload' bypasses HTTP cache so we never precache a stale build
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(u=>fetch(new Request(u,{cache:'reload'})).then(res=>{if(res.status===200)return c.put(u,res)}).catch(()=>{})))).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  // Skip non-GET and firebase requests
  if(e.request.method!=='GET')return;
  if(e.request.url.includes('firestore')||e.request.url.includes('googleapis.com/identitytoolkit'))return;

  e.respondWith(
    caches.match(e.request).then(r=>{
      if(r)return r;
      return fetch(e.request).then(res=>{
        if(res.status===200&&(e.request.url.startsWith(self.location.origin)||e.request.url.includes('unpkg.com')||e.request.url.includes('gstatic.com'))){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      });
    }).catch(()=>caches.match('./index.html'))
  );
});
