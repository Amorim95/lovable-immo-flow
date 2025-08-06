const CACHE_NAME = 'meu-crm-imob-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Adicione aqui outros arquivos estáticos importantes (CSS, JS, imagens) se necessário
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve do cache
        }
        return fetch(event.request); // Busca na rede
      }
    )
  );
});