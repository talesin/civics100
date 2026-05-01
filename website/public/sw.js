// Service Worker for Civics 100 PWA
// Strategy:
//   - Navigation (HTML): network-first → cache fallback (prevents stale chunk errors after deploy)
//   - /_next/static/ assets: cache-first (content-addressed, immutable)
//   - Everything else: network-first → cache fallback

// Bump this on every deploy to evict old cached HTML.
// A timestamp string works; a build ID injected at build time is better.
const CACHE_VERSION = 'civics100-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: precache only truly static assets (not HTML pages)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: delete every cache that doesn't belong to this version
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => !n.startsWith(CACHE_VERSION))
          .map((n) => {
            console.log('[SW] Removing old cache:', n);
            return caches.delete(n);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.protocol === 'chrome-extension:') return;

  // Immutable hashed assets → cache-first (safe forever)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML navigation → network-first (must be fresh after a deploy)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // Everything else (API, icons, manifest) → network-first
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// Cache-first: return cached response or fetch+cache
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// Network-first for navigation: fetch HTML fresh, fall back to cache or offline page
async function networkFirstNavigate(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    return offline ?? new Response('Offline', { status: 503 });
  }
}

// Network-first for other requests
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response('Offline', { status: 503 });
  }
}

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
