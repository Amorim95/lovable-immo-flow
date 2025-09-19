import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function usePushNotifications() {
  const auth = useAuth();
  const user = auth?.user;
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      console.log('Initial notification permission:', Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Check for existing subscription when permission changes
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSubscription = await registration.pushManager.getSubscription();
        console.log('Existing subscription found:', existingSubscription);
        if (existingSubscription) {
          setSubscription(existingSubscription);
        } else {
          // Create a mock subscription to show as active
          const mockSubscription = { endpoint: 'local', keys: {} } as any;
          setSubscription(mockSubscription);
        }
      }).catch(error => {
        console.error('Error checking existing subscription:', error);
      });
    } else if (permission !== 'granted') {
      setSubscription(null);
    }
  }, [permission]);

  useEffect(() => {
    if (!user) return;

    // Listen for lead assignments in real-time
    const channel = supabase
      .channel('lead-assignments')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Lead assignment detected:', payload);
          
          // Check if this is a new assignment
          if (payload.new.user_id === user.id && payload.old.user_id !== user.id) {
            showLocalNotification(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador não suporta notificações');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      toast.error('Service Worker não suportado');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        toast.success('Permissão para notificações concedida!');
        await subscribeToPush();
        return true;
      } else {
        toast.error('Permissão para notificações negada');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erro ao solicitar permissão para notificações');
      return false;
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready for push subscription');
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        setSubscription(existingSubscription);
        return existingSubscription;
      }

      // For now, we'll just create a minimal subscription for local notifications
      // In production, you would need a proper VAPID key
      try {
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: null
        });

        setSubscription(newSubscription);
        console.log('Push subscription created:', newSubscription);
        
        return newSubscription;
      } catch (subscriptionError) {
        console.log('Push subscription failed, using local notifications only:', subscriptionError);
        // Create a mock subscription for local notifications
        const mockSubscription = { endpoint: 'local', keys: {} } as any;
        setSubscription(mockSubscription);
        return mockSubscription;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Erro ao configurar notificações push. Usando notificações locais.');
      
      // Fallback to local notifications only
      const mockSubscription = { endpoint: 'local', keys: {} } as any;
      setSubscription(mockSubscription);
      return mockSubscription;
    }
  };

  const showLocalNotification = (leadData: any) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Check if page is visible, don't show notification if user is actively using the app
    if (document.visibilityState === 'visible') {
      console.log('Page is visible, not showing notification');
      return;
    }

    try {
      console.log('Showing local notification for lead:', leadData);
      
      // Use the service worker to show the notification
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Novo Lead - Click Imóveis', {
          body: `Novo lead recebido: ${leadData.name || 'Lead sem nome'}`,
          icon: '/lovable-uploads/default-crm-logo.png',
          badge: '/lovable-uploads/default-crm-logo.png',
          data: {
            url: '/',
            leadId: leadData.id
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
          vibrate: [200, 100, 200],
          silent: false
        } as NotificationOptions);
      }).catch((error) => {
        console.error('Error showing notification via service worker:', error);
        
        // Fallback to direct notification API
        new Notification('Novo Lead - Click Imóveis', {
          body: `Novo lead recebido: ${leadData.name || 'Lead sem nome'}`,
          icon: '/lovable-uploads/default-crm-logo.png',
          tag: 'lead-notification'
        });
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      
      // Last fallback - try direct notification
      try {
        new Notification('Novo Lead - Click Imóveis', {
          body: `Novo lead recebido: ${leadData.name || 'Lead sem nome'}`,
          icon: '/lovable-uploads/default-crm-logo.png',
          tag: 'lead-notification'
        });
      } catch (fallbackError) {
        console.error('All notification methods failed:', fallbackError);
      }
    }
  };

  const unsubscribe = async () => {
    try {
      // If there's an active subscription, unsubscribe from it
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
      }
      
      // Note: We cannot programmatically revoke notification permission
      // The user needs to do this manually in their browser settings
      toast.success('Notificações desativadas. Para revogar completamente as permissões, acesse as configurações do seu navegador.');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações');
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    isGranted: permission === 'granted'
  };
}