const CACHE      = 'campersan-v2';
const TILE_CACHE = 'campersan-tiles-v2';
const TILE_LIMIT = 500;

const PRECACHE = [
  '/',
  '/index.html',
  '/spots.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
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

  // OSM map tiles — cache on access, LRU-trim to TILE_LIMIT
  if (url.hostname.endsWith('.tile.openstreetmap.org')) {
    e.respondWith(handleTile(e.request));
    return;
  }

  // Versioned CDN assets (Leaflet, MarkerCluster) — cache-first, immutable
  if (url.hostname === 'unpkg.com') {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // spots.json — stale-while-revalidate: serve cached instantly, update in background
  if (url.pathname === '/spots.json') {
    e.respondWith(staleRevalidate(e.request));
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
