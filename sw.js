// Caravan TaM service worker - offline first
const CACHE = "caravan-tam-v013";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event)=>{
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event)=>{
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k===CACHE) ? null : caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event)=>{
  const req = event.request;
  const url = new URL(req.url);
  const isContent = url.pathname.endsWith("/content.json") || url.pathname.endsWith("content.json");
  event.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    if(isContent){
      try{
        const fresh = await fetch(req, {cache:"no-store"});
        if(req.method === "GET" && fresh && fresh.status === 200){
          cache.put(req, fresh.clone());
        }
        return fresh;
      }catch{
        const cached = await cache.match(req);
        if(cached) return cached;
        throw;
      }
    }

    const cached = await cache.match(req);
    if(cached) return cached;
    try{
      const fresh = await fetch(req);
      if(req.method === "GET" && fresh && fresh.status === 200){
        cache.put(req, fresh.clone());
      }
      return fresh;
    }catch{
      // offline fallback for navigations
      if(req.mode === "navigate"){
        return cache.match("./index.html");
      }
      throw;
    }
  })());
});
