import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationPermissionButton() {
  const { permission, requestPermission, unsubscribe, isSupported, isGranted } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  if (permission === 'denied') {
    return (
      <Button variant="outline" size="sm" disabled>
        <BellOff className="h-4 w-4 mr-2" />
        Notificações Negadas
      </Button>
    );
  }

  if (isGranted) {
    return (
      <Button variant="outline" size="sm" onClick={unsubscribe}>
        <Bell className="h-4 w-4 mr-2" />
        Desativar Notificações
      </Button>
    );
  }

  return (
    <Button variant="default" size="sm" onClick={requestPermission}>
      <Bell className="h-4 w-4 mr-2" />
      Ativar Notificações
    </Button>
  );
}