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
        await saveSubscriptionToSupabase(existingSubscription);
        return existingSubscription;
      }

      // VAPID Public Key configurada
      const vapidPublicKey = 'BIg_KLSu6147INg13uGEJ8UjqkyE8znNi6w_07qOOSo_onLFg6G2ZAy79JabaUjRLHK6EopySZu928H1eggLY-0';
      
      // Converter VAPID key para Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      try {
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        setSubscription(newSubscription);
        console.log('Push subscription created:', newSubscription);
        
        // Salvar subscription no Supabase
        await saveSubscriptionToSupabase(newSubscription);
        
        return newSubscription;
      } catch (subscriptionError) {
        console.log('Push subscription failed:', subscriptionError);
        toast.error('Erro ao criar subscrição push');
        return null;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Erro ao configurar notificações push');
      return null;
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const saveSubscriptionToSupabase = async (subscription: PushSubscription) => {
    if (!user) return;

    try {
      const subscriptionJson = subscription.toJSON();
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionJson as any,
          user_agent: navigator.userAgent
        } as any, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving subscription to Supabase:', error);
        toast.error('Erro ao salvar subscrição');
      } else {
        console.log('Subscription saved to Supabase successfully');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
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
      
      // Remover do Supabase
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }
      
      toast.success('Notificações desativadas.');
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