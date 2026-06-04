// ═══════════════════════════════════════════
//  BizMate GH — Service Worker
//  Strategy:
//   • App shell  → Cache-first (works offline)
//   • Supabase   → Network-first (fallback: queue)
//   • CDN assets → Cache on first fetch
// ═══════════════════════════════════════════

const VERSION   = 'bizmate-v2';
const CDN_CACHE = 'bizmate-cdn-v2';

// Files that make the app work offline
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// CDN libraries — cached on first use
const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ── INSTALL: pre-cache app shell ──────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: remove old caches ───────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== VERSION && k !== CDN_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: smart routing ──────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and browser-extension requests
  if (req.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // ── Supabase API → Network-first ──
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // ── CDN assets → Cache on first use ──
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(cacheFirst(req, CDN_CACHE));
    return;
  }

  // ── App shell + everything else → Cache-first ──
  event.respondWith(cacheFirst(req, VERSION));
});

// ── STRATEGIES ────────────────────────────────

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const response = await fetch(req);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, response.clone());
    }
    return response;
  } catch (err) {
    // Offline + not cached → return app shell for navigation
    if (req.mode === 'navigate') {
      const shell = await caches.match('/index.html');
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(req) {
  try {
    const response = await fetch(req);
    return response;
  } catch (err) {
    // Supabase offline → return empty JSON so app handles gracefully
    return new Response(
      JSON.stringify({ data: null, error: { message: 'offline' } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── BACKGROUND SYNC (when back online) ────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Notify all open tabs to trigger their backgroundSync()
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => client.postMessage({ type: 'SYNC_NOW' }));
}

// ── PUSH NOTIFICATIONS (future use) ───────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'BizMate GH', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'bizmate-notification',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length) { clients[0].focus(); return; }
      self.clients.openWindow('/');
    })
  );
});
