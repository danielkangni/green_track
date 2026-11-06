// Service worker : l'application reste utilisable avec une connexion faible
// ou coupée. App shell en « stale-while-revalidate », tuiles de carte en cache.
const APP = 'greentrack-app-v1';
const TILES = 'greentrack-tiles-v1';
const MAX_TILES = 600;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(['/', '/index.html', '/favicon.svg'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![APP, TILES].includes(k)).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

async function trimTiles() {
  const c = await caches.open(TILES);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open(TILES).then(async (c) => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) {
          c.put(e.request, res.clone());
          trimTiles();
        }
        return res;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.open(APP).then(async (c) => {
      const hit = await c.match(e.request);
      const net = fetch(e.request)
        .then((res) => {
          if (res.ok) c.put(e.request, res.clone());
          return res;
        })
        .catch(() => hit || c.match('/index.html'));
      return hit || net;
    })
  );
});
