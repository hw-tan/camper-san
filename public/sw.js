const CACHE      = 'campersan-v4';
const TILE_CACHE = 'campersan-tiles-v4';
const TILE_LIMIT = 500;

const PRECACHE = [
  '/',
  '/index.html',
  '/spots.json',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
];

// Pre-cache on install; don't skipWaiting so the update flow can show a toast
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
});

// Clean old caches; claim all clients so the SW is in control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== TILE_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Client sends this when user clicks "Reload" in the update banner
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Vector map tiles (CartoDB, OpenFreeMap) — cache on access, LRU-trim to TILE_LIMIT
  if (url.hostname.endsWith('cartocdn.com') || url.hostname.endsWith('openfreemap.org')) {
    e.respondWith(handleTile(e.request));
    return;
  }

  // Versioned CDN assets (MapLibre) — cache-first, immutable
  if (url.hostname === 'unpkg.com') {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // spots.json — network-first: always fetch fresh when online, fall back to cache offline
  if (url.pathname === '/spots.json') {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // index.html and everything else — network-first with cache fallback
  e.respondWith(networkFirst(e.request));
});

// ── Strategies ────────────────────────────────────────────────────────────

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) ?? new Response('Offline', { status: 503 });
  }
}

async function staleRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit   = await cache.match(req);
  fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); }).catch(() => {});
  return hit ?? fetch(req);
}

async function handleTile(req) {
  const cache = await caches.open(TILE_CACHE);
  const hit   = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) {
      cache.put(req, res.clone());
      // Trim oldest tiles when cache exceeds limit
      cache.keys().then(keys => {
        if (keys.length > TILE_LIMIT + 100)
          keys.slice(0, 100).forEach(k => cache.delete(k));
      });
    }
    return res;
  } catch {
    return new Response('', { status: 503 });
  }
}
