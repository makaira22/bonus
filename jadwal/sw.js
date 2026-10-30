// Service worker bersama untuk semua cabang JADWAL (scope: folder /jadwal/)
// Naikkan versi ini setiap kali kamu mengubah app.js / app.css
const PREFIX = 'jadwal-';
const CACHE = PREFIX + 'v5';
const BASE = self.registration.scope;                          // .../jadwal/
const SHARED = ['app.js', 'app.css', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'].map(u => BASE + u);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHARED.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // hanya hapus cache lama milik JADWAL (cache KAS GIANYAR tidak disentuh)
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Ambil versi terbaru dulu; kalau offline pakai yang tersimpan
function networkFirst(req, key) {
  return fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key || req, copy)); }
    return r;
  }).catch(() => caches.match(key || req));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const clean = url.origin + url.pathname;
  if (!clean.startsWith(BASE) && !url.hostname.startsWith('fonts.g')) return;

  if (req.mode === 'navigate') {                                // halaman cabang (…/jadwal/kode/)
    const key = clean.endsWith('/') ? clean + 'index.html' : clean;
    e.respondWith(networkFirst(req, key));
    return;
  }
  if (/\/(app\.js|app\.css|manifest\.json)$/.test(clean)) {    // kode aplikasi: selalu cek versi baru
    e.respondWith(networkFirst(req));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {   // ikon & font
    if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
