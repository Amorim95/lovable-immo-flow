import { useEffect } from 'react';
import { toast } from 'sonner';

export function PWALifecycle() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registrado com sucesso: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, prompt user to refresh
                  toast.info('Nova versão disponível!', {
                    description: 'Clique para atualizar',
                    action: {
                      label: 'Atualizar',
                      onClick: () => {
                        // Skip waiting and activate the new service worker immediately
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                      }
                    },
                    duration: 10000
                  });
                }
              });
            }
          });

          // Listen for controlling service worker changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Service worker updated, reload the page
            window.location.reload();
          });

        } catch (error) {
          console.log('SW registration falhou: ', error);
        }
      };

      if (document.readyState === 'loading') {
        window.addEventListener('load', registerSW);
      } else {
        registerSW();
      }
    }

    // Handle online/offline status
    const handleOnline = () => {
      toast.success('Conexão restaurada!');
    };

    const handleOffline = () => {
      toast.warning('Você está offline', {
        description: 'Algumas funcionalidades podem estar limitadas'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHOW_INSTALL_PROMPT') {
        console.log('Service Worker: Show install prompt message received');
      }
      
      if (event.data && event.data.type === 'APP_INSTALLED') {
        console.log('Service Worker: App installed message received');
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

  return null;
}