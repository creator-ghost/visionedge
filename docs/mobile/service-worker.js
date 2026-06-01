/* VisionEdge Mobile service worker */
const CACHE='visionedge-mobile-v1';
const ASSETS=['./','./index.html','./mobile.css','./mobile.js','./manifest.json',
  './assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  // Только свои файлы кэшируем; внешние сайты открываются в новой вкладке.
  if(!req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(req).then(c=> c || fetch(req).then(res=>{
      if(res&&res.status===200){ const cp=res.clone(); caches.open(CACHE).then(ca=>ca.put(req,cp)); }
      return res;
    }).catch(()=> caches.match('./index.html')))
  );
});
