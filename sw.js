// Lia's heart — offline cache: network first, fall back to the cached copy.
// Everything the app uses comes from this same site (no third-party requests).
const CACHE = 'lia-heart-v3';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'privacy.html', 'icons/icon-192.png', 'icons/icon-512.png',
  'lib/three/build/three.module.js', 'lib/three/examples/jsm/controls/OrbitControls.js', 'lib/three/examples/jsm/loaders/GLTFLoader.js',
  'lib/three/examples/jsm/utils/BufferGeometryUtils.js', 'lib/three/examples/jsm/libs/meshopt_decoder.module.js', 'lib/three/examples/jsm/environments/RoomEnvironment.js'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if (r.status === 200 && r.type === 'basic') { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
