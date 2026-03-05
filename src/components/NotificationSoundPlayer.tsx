import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Component that plays a notification sound and shows a desktop banner
 * when a push notification is received.
 */
export function NotificationSoundPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audioRef.current = audio;

    const handlePush = (data: any) => {
      console.log('[NotificationSound] Push received, playing sound...');
      playSound();
      showBanner(data);
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        handlePush(event.data.data);
      }
    };

    const channel = new BroadcastChannel('push-notifications');
    channel.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        handlePush(event.data.data);
      }
    });

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      channel.close();
    };
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log('[NotificationSound] Could not play sound:', error);
      });
    }
  };

  const showBanner = (data: any) => {
    if (!data) return;

    const title = data.title || 'Notificação';
    const body = data.body || '';

    // Detectar tipo de notificação pelo título/conteúdo
    const isLoss = title.includes('💔') || title.includes('Acabou o tempo') || title.includes('perdeu');
    const isWarning = title.includes('⚠️') || title.includes('perder');
    const isNewLead = title.includes('🔔') || title.includes('Novo Lead') || title.includes('Oportunidade');

    if (isLoss) {
      toast.error(body, {
        description: title,
        duration: 8000,
        position: 'top-right',
      });
    } else if (isWarning) {
      toast.warning(body, {
        description: title,
        duration: 10000,
        position: 'top-right',
      });
    } else if (isNewLead) {
      toast.success(body, {
        description: title,
        duration: 10000,
        position: 'top-right',
      });
    } else {
      toast.info(body, {
        description: title,
        duration: 8000,
        position: 'top-right',
      });
    }
  };

  return null;
}
