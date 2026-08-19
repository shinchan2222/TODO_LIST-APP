/* Service Worker for RoutineCraft — Offline Capability + Notification Routing */
const CACHE_NAME = 'routinecraft-v19';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './src/firebase.js',
    './src/plugins/local-notifications.js',
    './assets/icons/icon-72x72.png',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install Event
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('[SW] Some assets failed to cache, continuing in fallback mode.', err);
            });
        })
    );
});

// Activate Event — clear old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event — Network-First Strategy (No-Cache for version.json, Network-First for Assets, Offline Cache Fallback)
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Bypass cache completely for version.json & update requests
    if (url.pathname.endsWith('version.json') || url.searchParams.has('t')) {
        e.respondWith(
            fetch(e.request, { cache: 'no-store' }).catch(() => {
                return caches.match(e.request);
            })
        );
        return;
    }

    // Network-First Strategy for all app assets
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If offline or network fails, fallback to cached assets
                return caches.match(e.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (e.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// Notification Click — focus/open the app and route to tasks
self.addEventListener('notificationclick', (e) => {
    e.notification.close();

    const channelId = e.notification.tag || 'task_reminder';
    // Map channel to URL fragment; the app reads this to open the right view
    const urlMap = {
        'task_reminder': '/?view=tasks',
        'backup_completed': '/?view=settings',
        'summary': '/?view=analytics'
    };
    const targetUrl = urlMap[channelId] || '/';

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if open
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'NOTIF_CLICK', channelId: channelId });
                    return;
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
