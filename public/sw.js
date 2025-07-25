const CACHE_NAME = 'click-imoveis-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/lovable-uploads/09f7e1e7-f952-404f-8533-120ee54a68cd.png',
  '/manifest.json'
];

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (!event.data) {
    console.log('Service Worker: No data in push event');
    return;
  }

  const data = event.data.json();
  console.log('Service Worker: Push data:', data);

  const options = {
    body: data.body || 'Acabou de chegar um Lead para você!',
    icon: '/lovable-uploads/09f7e1e7-f952-404f-8533-120ee54a68cd.png',
    badge: '/lovable-uploads/09f7e1e7-f952-404f-8533-120ee54a68cd.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      leadId: data.leadId
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Lead'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ],
    requireInteraction: true,
    tag: 'lead-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Click Imóveis', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    const leadId = event.notification.data?.leadId;
    const url = leadId ? `/lead/${leadId}` : '/';
    
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Erro ao abrir cache', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle PWA install prompt
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('Service Worker: beforeinstallprompt event fired');
  event.preventDefault();
  // Store the event so it can be triggered later
  self.deferredPrompt = event;
  
  // Update UI to notify the user they can install the PWA
  self.postMessage({ type: 'SHOW_INSTALL_PROMPT' });
});

// Handle app installed
self.addEventListener('appinstalled', (event) => {
  console.log('Service Worker: App was installed');
  self.postMessage({ type: 'APP_INSTALLED' });
});