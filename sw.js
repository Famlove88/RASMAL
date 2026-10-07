/* رأس مالي — service worker
   - الصفحة: الشبكة أولاً، وإذا ما في إنترنت من الكاش
   - الخطوط وملفات Firebase: من الكاش مع تحديث بالخلفية
   - بيمحي بس الكاش يلي اسمو بيبلّش بـ rasmali- (ما بيقرّب على باقي البرامج بنفس الموقع) */
const PREFIX = 'rasmali-';
const CACHE = PREFIX + 'pwa-v5';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];
const STATIC_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const okToCache = res => res && (res.ok || res.type === 'opaque');
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (STATIC_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (okToCache(res)) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;           // Firestore / Auth: مباشرة عالشبكة
  if (!url.pathname.startsWith(new URL('./', self.location).pathname)) return;
  e.respondWith(fetch(req).then(res => {
    if (okToCache(res)) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
