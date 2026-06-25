const CACHE_NAME = 'myexpert-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icons/plumber.png',
  '/assets/icons/painter.png',
  '/assets/icons/cook.png',
  '/assets/icons/carpenter.png',
  '/assets/icons/electrician.png'
];

// Install Event - cache core routes and assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Service Worker] Failed to pre-cache some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - network-first for pages, cache-first for static assets, bypass next.js internals
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip external/extension requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // CRITICAL: Bypass Service Worker caching entirely for Next.js development/production internal assets, HMR, and API routes
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('webpack') ||
    url.pathname.includes('hot-update') ||
    url.searchParams.has('_rsc')
  ) {
    return;
  }

  // Network-first strategy for navigation requests (HTML pages) to prevent chunk load errors/stale pages
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Update the cached page on successful navigation fetch
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/');
          });
        })
    );
    return;
  }

  // Cache-first, network fallback strategy for static assets (icons, manifest, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Only cache valid basic responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache static assets (images, fonts, etc.)
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Static fetch failed:', err);
        return new Response('Asset offline', { status: 408 });
      });
    })
  );
});
