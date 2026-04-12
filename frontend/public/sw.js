/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'dzidzaai-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      self.clients.claim();
    })()
  );
});

function isApiGet(request) {
  try {
    const url = new URL(request.url);
    return request.method === 'GET' && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Network-first for API GETs (fallback to cache)
  if (isApiGet(req)) {
    event.respondWith(
      (async () => {
        const apiCache = await caches.open(API_CACHE);
        try {
          const fresh = await fetch(req);
          apiCache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await apiCache.match(req);
          if (cached) return cached;
          throw new Error('Offline and no cached API response');
        }
      })()
    );
    return;
  }

  // Cache-first for everything else (static)
  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;

      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    })()
  );
});
