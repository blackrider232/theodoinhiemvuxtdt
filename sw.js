const CACHE_NAME = 'sce-nhiemvu-pwa-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './Logo.jpg',
    './apple-touch-icon.png',
    './app-icon-192.png',
    './app-icon-512.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const reqUrl = event.request.url;

    // Không cache các request tới Supabase hoặc Google Apps Script API
    if (
        event.request.method !== 'GET' ||
        reqUrl.includes('supabase.co') ||
        reqUrl.includes('script.google.com') ||
        reqUrl.includes('/rest/v1/') ||
        reqUrl.includes('/auth/v1/') ||
        reqUrl.includes('/realtime/v1/')
    ) {
        return;
    }

    // Chiến lược Network-First cho giao diện tĩnh, fallback sang Cache khi Offline
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
