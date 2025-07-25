import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationManager() {
  // Initialize push notifications hook
  usePushNotifications();
  
  return null;
}