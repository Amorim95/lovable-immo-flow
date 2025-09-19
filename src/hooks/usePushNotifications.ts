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
    }
  }, []);

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
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        return existingSubscription;
      }

      // Create new subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null // For testing, we'll use local notifications
      });

      setSubscription(newSubscription);
      console.log('Push subscription created:', newSubscription);
      
      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Erro ao configurar notificações push');
      return null;
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
      // Use the service worker to show the notification
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Click Imóveis', {
          body: 'Acabou de chegar um Lead para você!',
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
          tag: 'lead-notification'
        } as NotificationOptions);
      });
    } catch (error) {
      console.error('Error showing notification:', error);
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
    isGranted: permission === 'granted' && subscription !== null
  };
}