import { useState } from 'react';
import { Bell, Check, CheckCheck, User, RefreshCw } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

function getTypeIcon(type: string) {
  switch (type) {
    case 'repique':
      return <RefreshCw className="w-4 h-4 text-amber-500" />;
    case 'transfer':
      return <User className="w-4 h-4 text-blue-500" />;
    default:
      return <Bell className="w-4 h-4 text-primary" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'repique': return 'Repique';
    case 'transfer': return 'Transferência';
    default: return 'Novo Lead';
  }
}

function NotificationItem({ notification, onRead, onClick }: {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: (n: Notification) => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 cursor-pointer transition-colors border-b border-border/50 last:border-0 ${
        notification.is_read
          ? 'bg-background opacity-70'
          : 'bg-primary/5 hover:bg-primary/10'
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="mt-0.5 flex-shrink-0">
        {getTypeIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {getTypeLabel(notification.type)}
          </span>
          {!notification.is_read && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-sm font-medium text-foreground truncate mt-0.5">
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.body}
        </p>
        <span className="text-[10px] text-muted-foreground mt-1 block">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      </div>
      {!notification.is_read && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRead(notification.id);
          }}
        >
          <Check className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.lead_id) {
      if (isMobile) {
        navigate(`/lead/${notification.lead_id}`);
      } else {
        navigate(`/?leadId=${notification.lead_id}`);
      }
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-bold flex items-center justify-center rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[360px]"
        align={isMobile ? "end" : "start"}
        side={isMobile ? "bottom" : "right"}
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-3 h-3" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onClick={handleNotificationClick}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
