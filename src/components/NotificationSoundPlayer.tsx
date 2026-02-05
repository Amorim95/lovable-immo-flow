import { useEffect, useRef } from 'react';

/**
 * Component that plays a notification sound when a push notification is received.
 * Uses the Service Worker's message event to detect incoming notifications.
 */
export function NotificationSoundPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notification sound
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audioRef.current = audio;

    // Listen for messages from Service Worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        console.log('[NotificationSound] Push received, playing sound...');
        playSound();
      }
    };

    // Listen for push notifications via BroadcastChannel (more reliable)
    const channel = new BroadcastChannel('push-notifications');
    channel.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        console.log('[NotificationSound] Push received via BroadcastChannel, playing sound...');
        playSound();
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
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log('[NotificationSound] Could not play sound:', error);
      });
    }
  };

  return null;
}
