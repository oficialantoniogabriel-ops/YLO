const CACHE_NAME = 'ylo-static-v1';
const OFFLINE_URL = '/index.html';

// Lista de recursos a pré-cachear (adapte se adicionar arquivos)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // não tente fazer cache de requests de terceiros (ex: api externas)
  if (new URL(request.url).origin !== location.origin) {
    return;
  }

  // Strategy: Network first, fallback to cache, then offline page
  event.respondWith(
    fetch(request).then((response) => {
      // atualiza o cache com a resposta nova
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
      return response;
    }).catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) return cached;
        // fallback para offline page se for navegação HTML
        if (request.mode === 'navigate' || (request.headers && request.headers.get('accept')?.includes('text/html'))) {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
