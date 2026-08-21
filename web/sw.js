/**
 * Service Worker for PWA Functionality
 * Handles caching and offline support
 */

// ============================================================
// Configuration
// ============================================================

const CACHE_NAME = 'interest-calc-apk-v1';

const ASSETS_TO_CACHE = [
    './',
    './manifest.json',
    './static/css/styles.css',
    './static/js/scripts.js',
    './static/images/icon-192x192.png',
    './static/images/icon-512x512.png',
    './static/vendor/chart.umd.min.js',
    './static/vendor/jspdf.umd.min.js',
    './static/vendor/bootstrap-icons/bootstrap-icons.min.css',
    './static/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2',
    './static/vendor/bootstrap-icons/fonts/bootstrap-icons.woff',
    './static/vendor/fonts/google-fonts.css'
];

// ============================================================
// Message Event - Skip Waiting (instant update)
// ============================================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================================
// Install Event - Cache Assets
// ============================================================

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    // Activate immediately
    self.skipWaiting();
});

// ============================================================
// Fetch Event - Network First, Fallback to Cache
// ============================================================

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Manifest — network first so theme/icon updates propagate
    if (url.pathname.includes('manifest.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // HTML pages — network first, cache fallback (offline support)
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Static assets — cache-first with background refresh
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    fetch(event.request).then(response => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                    }).catch(() => {});
                    return cachedResponse;
                }
                return fetch(event.request);
            })
    );
});

// ============================================================
// Activate Event - Clean Old Caches
// ============================================================

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
    );
    // Take control immediately
    self.clients.claim();
});
