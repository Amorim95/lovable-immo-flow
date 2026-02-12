import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Cache para a VAPID key
let cachedVapidKey: string | null = null;

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
      navigator.serviceWorker.ready.then(async (registration: any) => {
        const existingSubscription = await registration.pushManager.getSubscription();
        console.log('Existing subscription found:', existingSubscription);
        if (existingSubscription) {
          setSubscription(existingSubscription);
        } else {
          // No real subscription exists - keep as null so reactivation banner shows
          console.log('No real subscription found, needs reactivation');
          setSubscription(null);
        }
      }).catch(error => {
        console.error('Error checking existing subscription:', error);
        setSubscription(null);
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

  const getVapidPublicKey = async (): Promise<string | null> => {
    // Usar cache se disponível
    if (cachedVapidKey) {
      console.log('[Push] Using cached VAPID key');
      return cachedVapidKey;
    }

    try {
      console.log('[Push] Fetching VAPID public key from server...');
      const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
      
      if (error) {
        console.error('[Push] Error fetching VAPID key:', error);
        return null;
      }
      
      if (data?.publicKey) {
        cachedVapidKey = data.publicKey;
        console.log('[Push] VAPID key fetched successfully');
        return data.publicKey;
      }
      
      console.error('[Push] No public key in response');
      return null;
    } catch (error) {
      console.error('[Push] Failed to fetch VAPID key:', error);
      return null;
    }
  };

  const subscribeToPush = async () => {
    try {
      console.log('[Push] Starting subscription process...');
      
      const registration = await navigator.serviceWorker.ready as any;
      console.log('[Push] Service Worker ready:', registration);
      console.log('[Push] PushManager available:', !!registration.pushManager);
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      console.log('[Push] Existing subscription:', existingSubscription);
      
      if (existingSubscription) {
        console.log('[Push] Already subscribed to push notifications');
        setSubscription(existingSubscription);
        await saveSubscriptionToSupabase(existingSubscription);
        return existingSubscription;
      }

      // Buscar VAPID key do servidor
      const vapidPublicKey = await getVapidPublicKey();
      
      if (!vapidPublicKey) {
        toast.error('Erro ao obter chave de configuração. Tente novamente.');
        return null;
      }
      
      // Converter VAPID key para Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      console.log('[Push] VAPID key converted, length:', convertedVapidKey.length);

      console.log('[Push] Attempting to subscribe with options:', {
        userVisibleOnly: true,
        keyLength: convertedVapidKey.length
      });
      
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
      } catch (subscriptionError: any) {
        console.error('[Push] Subscription failed:', {
          name: subscriptionError?.name,
          message: subscriptionError?.message,
          stack: subscriptionError?.stack
        });
        
        // Detectar ambiente
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isStandalone = (window.navigator as any).standalone === true || 
          window.matchMedia('(display-mode: standalone)').matches;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        console.error('[Push] Environment:', { isIOS, isStandalone, isSafari });
        
        if (isIOS && !isStandalone) {
          toast.error('Instale o app na tela inicial primeiro (Compartilhar → Adicionar à Tela Inicial)');
        } else if (isIOS && isStandalone) {
          // Está no PWA mas ainda falhou - pode ser problema de permissão ou VAPID
          toast.error('Verifique se as notificações estão permitidas em Ajustes → Notificações → CRM.Imob');
        } else if (subscriptionError?.name === 'NotAllowedError') {
          toast.error('Permissão negada. Verifique as configurações do navegador.');
        } else {
          toast.error(`Erro: ${subscriptionError?.message || 'Falha ao criar subscrição'}`);
        }
        return null;
      }
    } catch (error: any) {
      console.error('[Push] General error:', error);
      toast.error(`Erro ao configurar notificações: ${error?.message || 'Erro desconhecido'}`);
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
      navigator.serviceWorker.ready.then((registration: any) => {
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