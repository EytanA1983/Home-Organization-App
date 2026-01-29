/**
 * Custom Service Worker
 * 
 * This service worker is built by vite-plugin-pwa using injectManifest mode.
 * It includes:
 * - Workbox precaching and runtime caching
 * - Push notification handling
 * - Background sync (future)
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// ==================== PRECACHING ====================

// Precache all assets built by Vite (injected by workbox)
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches from previous versions
cleanupOutdatedCaches();

// ==================== RUNTIME CACHING ====================

// Cache names
const API_CACHE = 'api-cache-v1';
const STATIC_CACHE = 'static-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';
const FONT_CACHE = 'font-cache-v1';

// API calls - NetworkFirst with fallback to cache
// Data should be fresh but available offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Static assets (JS, CSS) - CacheFirst
// Content-hashed, safe to cache aggressively
registerRoute(
  ({ request, url }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/assets/'),
  new CacheFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Images - CacheFirst with longer expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Fonts - CacheFirst with very long expiration
registerRoute(
  ({ request, url }) =>
    request.destination === 'font' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: FONT_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Navigation (HTML pages) - NetworkFirst
// Serve fresh content when possible
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 5,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
    {
      // Don't treat API calls as navigations
      denylist: [/^\/api\//],
    }
  )
);

// Everything else - StaleWhileRevalidate
registerRoute(
  () => true,
  new StaleWhileRevalidate({
    cacheName: 'misc-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// ==================== PUSH NOTIFICATIONS ====================

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    actions?: { action: string; title: string }[];
    renotify?: boolean;
    requireInteraction?: boolean;
  };

  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'הודעה חדשה',
      body: event.data.text(),
    };
  }

  const title = payload.title || 'הודעה';
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url ?? '/',
      dateOfArrival: Date.now(),
    },
    actions: payload.actions || [
      { action: 'view', title: 'צפה' },
      { action: 'dismiss', title: 'התעלם' },
    ],
    tag: payload.tag || 'eli-maor-notification',
    renotify: payload.renotify || false,
    requireInteraction: payload.requireInteraction || false,
    dir: 'rtl',
    lang: 'he',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data?.url as string) ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// ==================== BACKGROUND SYNC ====================

// Background sync for offline task updates (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncPendingTasks());
  }
  if (event.tag === 'sync-todos') {
    event.waitUntil(syncPendingTodos());
  }
});

async function syncPendingTasks(): Promise<void> {
  console.log('Background sync: syncing pending tasks...');
  // TODO: Implement offline task queue sync
}

async function syncPendingTodos(): Promise<void> {
  console.log('Background sync: syncing pending todos...');
  // TODO: Implement offline todo queue sync
}

// ==================== LIFECYCLE ====================

// Skip waiting - activate new service worker immediately
self.addEventListener('install', () => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Claim clients - take control of pages immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old versioned caches
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => {
              // Delete caches from older versions
              const isVersioned = name.match(/-v\d+$/);
              const isOldVersion = isVersioned && !name.endsWith('-v1');
              return isOldVersion;
            })
            .map((name) => {
              console.log('Deleting old cache:', name);
              return caches.delete(name);
            })
        )
      ),
    ])
  );
});

// ==================== MESSAGING ====================

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((names) =>
          Promise.all(names.map((name) => caches.delete(name)))
        )
      );
      break;

    case 'GET_CACHE_SIZE':
      event.waitUntil(
        getCacheSize().then((size) => {
          event.ports[0]?.postMessage({ size });
        })
      );
      break;
  }
});

async function getCacheSize(): Promise<number> {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}
