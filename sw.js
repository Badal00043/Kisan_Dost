/* ============================================================
   Kisan Dost — Service Worker
   Offline-first caching, background sync, TTL enforcement
   ============================================================ */

const CACHE_NAME = 'kisan-dost-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/db.js',
  '/js/i18n.js',
  '/js/weather.js',
  '/js/advisory.js',
  '/js/notifications.js',
  '/js/gemini.js',
  '/js/speech.js',
  '/js/whisper-worker.js',
  '/js/crop-disease.js',
  '/js/app.js',
  '/lang/en.json',
  '/lang/hi.json',
  '/lang/mr.json',
  '/lang/bn.json',
  '/data/schemes.json',
  '/data/profile.json'
];

const API_CACHE_NAME = 'kisan-dost-api-v1';
const API_TTL = 30 * 60 * 1000; // 30 minutes

// ---- INSTALL: Pre-cache static assets ----
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Pre-cache failed (some assets may be missing):', err);
        // Skip waiting even if some assets fail (e.g., icons not yet created)
        return self.skipWaiting();
      })
  );
});

// ---- ACTIVATE: Clean old caches ----
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map(key => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ---- FETCH: Cache-first for static, stale-while-revalidate for API ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // HuggingFace model CDN — let browser cache handle it natively (opaque response ok)
  // Whisper ONNX model files are large; we allow browser to cache them independently.
  if (url.hostname.includes('huggingface.co') || url.hostname.includes('cdn.jsdelivr.net')) {
    // Just let it pass through, browser's built-in cache will handle model files
    return;
  }

  // API requests (OpenWeatherMap)
  if (url.hostname.includes('openweathermap.org')) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }

  // Static assets — cache-first
  event.respondWith(handleStaticRequest(event.request));
});

/** Cache-first strategy for static assets */
async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Offline fallback — return the app shell
    const fallback = await caches.match('/index.html');
    if (fallback) return fallback;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Stale-while-revalidate for API calls with TTL */
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);

  // Try cache first
  const cached = await cache.match(request);
  if (cached) {
    const cachedTime = cached.headers.get('sw-cache-time');
    const age = Date.now() - (parseInt(cachedTime) || 0);

    if (age < API_TTL) {
      // Fresh cache — serve it, but refresh in background
      refreshAPICache(request, cache);
      return cached;
    }
  }

  // Cache miss or expired — try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and add timestamp header
      const responseBody = await networkResponse.clone().arrayBuffer();
      const newHeaders = new Headers(networkResponse.headers);
      newHeaders.set('sw-cache-time', Date.now().toString());

      const timestampedResponse = new Response(responseBody, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: newHeaders
      });

      cache.put(request, timestampedResponse.clone());
      return timestampedResponse;
    }
    return networkResponse;
  } catch (err) {
    // Offline — return stale cache if available
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/** Background refresh for stale-while-revalidate */
async function refreshAPICache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseBody = await networkResponse.clone().arrayBuffer();
      const newHeaders = new Headers(networkResponse.headers);
      newHeaders.set('sw-cache-time', Date.now().toString());

      const timestampedResponse = new Response(responseBody, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: newHeaders
      });

      cache.put(request, timestampedResponse);
    }
  } catch (err) {
    // Silent fail — we already served from cache
  }
}

// ---- BACKGROUND SYNC ----
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'weather-sync') {
    event.waitUntil(syncWeatherData());
  }
});

async function syncWeatherData() {
  // This would re-fetch weather data when connectivity is restored
  // The main app handles this via the 'online' event + loadAppData()
  console.log('[SW] Syncing weather data...');
  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE', payload: 'weather' });
  });
}

// ---- PUSH NOTIFICATIONS (placeholder) ----
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Kisan Dost';
  const options = {
    body: data.body || 'New farming advisory available',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});

// ---- MESSAGE HANDLER ----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
