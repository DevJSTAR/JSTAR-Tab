const CACHE_PREFIX = 'jstartab-cache';
const VERSION_URL = 'https://www.junaid.xyz/projects/jstar-tab/version.txt';
const STATIC_CACHE = 'jstartab-static';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.add(VERSION_URL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', async (event) => {
  if (event.data.action === 'updateFavicons') {
    const faviconUrls = event.data.urls;
    const currentDate = new Date();
    const cacheName = `${CACHE_PREFIX}-${currentDate.toISOString().split('T')[0]}`;
    
    const cache = await caches.open(cacheName);
    await cache.addAll(faviconUrls);
    
    const keys = await caches.keys();
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX) && key !== cacheName) {
        caches.delete(key);
      }
    });
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (event.request.url.startsWith('https://www.google.com/s2/favicons')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          const cacheCopy = fetchResponse.clone();
          caches.open(`${CACHE_PREFIX}-${new Date().toISOString().split('T')[0]}`)
            .then((cache) => cache.put(event.request, cacheCopy));
          return fetchResponse;
        });
      })
    );
  }

  if (request.url === VERSION_URL) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => 
        fetch(request).then(networkResponse => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }).catch(() => cache.match(request))
      )
    );
  }
});