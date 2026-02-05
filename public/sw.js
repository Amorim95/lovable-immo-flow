const CACHE_NAME = 'click-imoveis-v2';
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
    tag: 'lead-notification',
    silent: false // Allow system sound
  };

  // Notify all clients that a push was received (for custom sound)
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'Click Imóveis', options),
      // Broadcast to all clients to play sound
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PUSH_RECEIVED', data });
        });
      }),
      // Also use BroadcastChannel for better reliability
      (async () => {
        try {
          const channel = new BroadcastChannel('push-notifications');
          channel.postMessage({ type: 'PUSH_RECEIVED', data });
          channel.close();
        } catch (e) {
          console.log('BroadcastChannel not supported');
        }
      })()
    ])
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
  // Skip waiting to activate immediately
  self.skipWaiting();
  
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

// Fetch event - Network First strategy for HTML, Cache First for assets
self.addEventListener('fetch', (event) => {
  // For HTML pages, use network first strategy
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // For other resources, use cache first strategy
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
});

// Activate event
self.addEventListener('activate', (event) => {
  // Take control immediately
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
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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