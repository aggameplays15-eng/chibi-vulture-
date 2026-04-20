const CACHE_VERSION = 'v3';
const STATIC_CACHE  = `chibi-static-${CACHE_VERSION}`;
const IMAGE_CACHE   = `chibi-images-${CACHE_VERSION}`;
const API_CACHE     = `chibi-api-${CACHE_VERSION}`;

const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => ![STATIC_CACHE, IMAGE_CACHE, API_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Ignorer les extensions navigateur et les schémas non-http
  if (!url.protocol.startsWith('http')) return;

  // En développement (localhost) — ne pas intercepter, laisser passer directement
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  // API — network first, fallback cache (GET uniquement)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Images externes — cache first, long TTL
  if (request.destination === 'image' || url.hostname !== self.location.hostname) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Assets statiques — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// ── Stratégies ───────────────────────────────────────────────────────────────

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise || new Response('', { status: 408 });
}

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Chibi Vulture', {
      body: data.body || 'Nouvelle notification !',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'notif',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// ── Background sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') event.waitUntil(syncOfflinePosts());
});

async function syncOfflinePosts() {
  const cache = await caches.open('chibi-offline-queue');
  const keys = await cache.keys();
  for (const key of keys) {
    const cached = await cache.match(key);
    if (!cached) continue;
    try {
      const body = await cached.json();
      await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      await cache.delete(key);
    } catch {
      // Réessayer au prochain sync
    }
  }
}
