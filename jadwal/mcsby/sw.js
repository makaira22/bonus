// Service worker MC Surabaya (scope: folder /jadwal/mcsby/)
const PREFIX = 'mcsby-';
const CACHE = PREFIX + 'v2';
const BASE = self.registration.scope;
const SHELL = ['index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'].map(u => BASE + u);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), clean = url.origin + url.pathname;
  if (req.mode === 'navigate' && clean.startsWith(BASE)) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(BASE + 'index.html', c)); } return r; })
      .catch(() => caches.match(BASE + 'index.html')));
    return;
  }
  if (SHELL.includes(clean) || url.hostname.startsWith('fonts.g')) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
