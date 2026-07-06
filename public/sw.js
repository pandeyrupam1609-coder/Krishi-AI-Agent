const CACHE_NAME = 'krishi-ai-cache-v1';
const ASSETS_TO_CACHE = [
  '/dashboard',
  '/disease-detection',
  '/chatbot',
  '/market',
  '/schemes',
  '/globals.css',
  '/favicon.ico',
  '/manifest.json'
];

// Install Service Worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching offline shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache store:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept requests (Network First, Cache Fallback strategy)
self.addEventListener('fetch', (event) => {
  // Only handle standard GET requests for documents and resources
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip caching for Next.js hot reload / webpack streams in development
  if (url.pathname.startsWith('/_next') || url.pathname.includes('webpack')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If response is valid, clone and cache it
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network request fails, look in cache
        console.log('[Service Worker] Network request failed, loading from cache:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the page request fails, and it's a navigation request, return default cached dashboard
          if (event.request.mode === 'navigate') {
            return caches.match('/dashboard');
          }
        });
      })
  );
});
