// Naikkan versi ini setiap kali kamu mengubah jadwal.html agar HP mengambil versi baru
const PREFIX = 'jadwal-';
const CACHE = PREFIX + 'v1';
const SHELL = ['./jadwal.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const SHELL_URLS = SHELL.map(u => new URL(u, self.registration.scope).href);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // hanya hapus cache lama milik JADWAL (cache KAS GIANYAR tidak disentuh)
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.href.startsWith(self.registration.scope)) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./jadwal.html', copy)); return r; })
      .catch(() => caches.match('./jadwal.html')));
    return;
  }
  if (SHELL_URLS.includes(url.href.split('?')[0]) || url.hostname.startsWith('fonts.g')) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
