const CACHE_NAME = 'bharat-kisan-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.css',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('SW: Pre-caching static assets');
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`SW: Failed to pre-cache asset: ${asset}`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('SW: Removing old cache', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (except for those in STATIC_ASSETS)
  if (!event.request.url.startsWith(self.location.origin) && 
      !STATIC_ASSETS.some(asset => event.request.url.includes(asset))) {
    return;
  }

  // Skip API calls for caching (network only)
  if (event.request.url.includes('/api/') || event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache the new version
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      if (cachedResponse) {
        // Fetch in background to update cache, catch silently
        fetchPromise.catch((err) => {
          console.warn('Background sync failed for:', event.request.url, err);
        });
        return cachedResponse;
      }

      // If no cached response exists, return the direct fetchPromise without swallowing errors as undefined
      return fetchPromise;
    })
  );
});
