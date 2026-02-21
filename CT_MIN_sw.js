// Minimal offline cache for GitHub Pages
const CACHE = "ct-cache-v0.6.0";
const ASSETS = ["./","./index.html","./app.css","./app.js","./content.json","./manifest.webmanifest"];
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):Promise.resolve()))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",(e)=>{e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return res;}).catch(()=>cached)))});
