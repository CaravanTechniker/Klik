const CACHE = "ctam-cache-v1.0.0";
const ASSETS = ["./","./index.html","./app.js","./content.json","./manifest.webmanifest"];
self.addEventListener("install", (e)=>{ e.waitUntil((async()=>{ const c=await caches.open(CACHE); await c.addAll(ASSETS.map(u=>new Request(u,{cache:"reload"}))); self.skipWaiting(); })()); });
self.addEventListener("activate",(e)=>{ e.waitUntil((async()=>{ const keys=await caches.keys(); await Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):Promise.resolve())); self.clients.claim(); })()); });
self.addEventListener("fetch",(e)=>{ if(e.request.method!=="GET") return; e.respondWith((async()=>{ const c=await caches.open(CACHE); const cached=await c.match(e.request); const fetchP=fetch(e.request).then(r=>{ if(r&&r.ok) c.put(e.request,r.clone()); return r; }).catch(()=>cached); return cached||fetchP; })()); });
