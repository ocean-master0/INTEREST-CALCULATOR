/**
 * Service Worker for PWA Functionality
 * Handles caching and offline support
 */

// ============================================================
// Configuration
// ============================================================

const CACHE_NAME = 'interest-calc-v4';

const ASSETS_TO_CACHE = [
    '/',
    '/static/css/styles.css',
    '/static/js/scripts.js',
    '/static/manifest.json',
    '/static/images/icon-192x192.png',
    '/static/images/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

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
    
    // API calls — network first (CSRF token required fresh)
    if (event.request.url.includes('/calculate')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return new Response(JSON.stringify({ error: 'You are offline' }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }
    
    // HTML pages — network first (CSRF token in page must be fresh)
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
