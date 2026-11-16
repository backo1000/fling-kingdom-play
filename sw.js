/* Fling Kingdom's offline cache. Network first, so a new build arrives as soon as there is signal; the cache answers when there is none.
   publish_site.py stamps VERSION with the build, so each publish starts a fresh cache. */
const VERSION = 'fk-6927723';
/* Billy's music (music/*.mp3) is too big to fetch up front: it is kept the first time it plays, in its own cache, which survives a new build
   as long as the music has not changed (publish_site.py stamps MUSICVER from the files' names and sizes). */
const MUSIC = 'fk-music-286d37e7d0';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-any-192.png', 'icon-any-512.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(VERSION).then(c=> c.addAll(CORE)).then(()=> self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=> Promise.all(ks.filter(k=> k !== VERSION && k !== MUSIC).map(k=> caches.delete(k)))).then(()=> self.clients.claim())); });
self.addEventListener('fetch', e=>{ if(e.request.method !== 'GET') return;
  if(/\/(rest|auth)\/v1\//.test(new URL(e.request.url).pathname)) return;   /* the online save (Supabase): never cached, always the network */
  if(/\/music\/[^/]+\.mp3$/.test(new URL(e.request.url).pathname)){ e.respondWith(caches.open(MUSIC).then(c=> c.match(e.request.url).then(m=> m || fetch(e.request.url).then(r=>{ if(r && r.status === 200) c.put(e.request.url, r.clone()); return r; })))); return; }
  e.respondWith(fetch(e.request, {cache:'no-cache'}).then(r=>{ if(r && (r.ok || r.type === 'opaque')){ const copy = r.clone(); caches.open(VERSION).then(c=> c.put(e.request, copy)); } return r; })
    .catch(()=> caches.match(e.request).then(m=> m || caches.match('index.html')))); });
