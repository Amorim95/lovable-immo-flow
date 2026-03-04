import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Smartphone, Download, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type NotificationBlockReason = 
  | 'not-supported'
  | 'ios-not-pwa'
  | 'ios-old-version'
  | 'permission-denied'
  | 'needs-reactivation'
  | 'needs-activation'
  | null;

function detectBlockReason(
  isSupported: boolean,
  permission: NotificationPermission,
  hasDbSubscription: boolean | null,
  subscription: PushSubscription | null
): NotificationBlockReason {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isStandalone = (window.navigator as any).standalone === true || 
    window.matchMedia('(display-mode: standalone)').matches;

  // Check iOS version >= 16.4
  if (isIOS) {
    const versionMatch = ua.match(/OS (\d+)_(\d+)/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      if (major < 16 || (major === 16 && minor < 4)) {
        return 'ios-old-version';
      }
    }
    if (!isStandalone) {
      return 'ios-not-pwa';
    }
  }

  if (!isSupported) return 'not-supported';
  if (permission === 'denied') return 'permission-denied';

  const hasValidSubscription = subscription && permission === 'granted';
  if (hasValidSubscription) return null;

  if (hasDbSubscription && !subscription) return 'needs-reactivation';
  return 'needs-activation';
}

function getBlockContent(reason: NotificationBlockReason) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  switch (reason) {
    case 'not-supported':
      return {
        title: '⚠️ Navegador Incompatível',
        description: 'Seu navegador não suporta notificações push. Use o Google Chrome, Microsoft Edge ou Safari (iOS 16.4+) para receber alertas de novos leads.',
        gradient: 'bg-gradient-to-r from-red-500/90 to-red-600',
        icon: <AlertTriangle className="w-5 h-5" />,
        showButton: false,
        showDismiss: true,
      };

    case 'ios-old-version':
      return {
        title: '📱 Atualize seu iPhone',
        description: 'Notificações push exigem iOS 16.4 ou superior. Atualize seu iPhone em Ajustes → Geral → Atualização de Software.',
        gradient: 'bg-gradient-to-r from-red-500/90 to-red-600',
        icon: <Smartphone className="w-5 h-5" />,
        showButton: false,
        showDismiss: true,
      };

    case 'ios-not-pwa':
      return {
        title: '📲 Instale o App primeiro',
        description: 'No iPhone, notificações só funcionam com o app instalado. Toque em Compartilhar (↑) → "Adicionar à Tela de Início" e depois abra por lá.',
        gradient: 'bg-gradient-to-r from-blue-500/90 to-blue-600',
        icon: <Download className="w-5 h-5" />,
        showButton: false,
        showDismiss: true,
      };

    case 'permission-denied':
      return {
        title: '🔔 Notificações Bloqueadas',
        description: isIOS
          ? 'Acesse Ajustes → Notificações → CRM.Imob e ative as notificações.'
          : isAndroid
          ? 'Toque no cadeado 🔒 na barra de endereço → Permissões → Notificações → Permitir. Depois recarregue a página.'
          : 'Clique no cadeado 🔒 na barra de endereço → Permissões → Notificações → Permitir. Depois recarregue a página.',
        gradient: 'bg-gradient-to-r from-red-500/90 to-red-600',
        icon: <Shield className="w-5 h-5" />,
        showButton: false,
        showDismiss: true,
      };

    case 'needs-reactivation':
      return {
        title: '⚠️ Reative suas notificações!',
        description: 'Houve uma atualização no sistema. Por favor, reative as notificações para continuar recebendo alertas de novos leads.',
        buttonText: 'Reativar Agora',
        loadingText: 'Reativando...',
        gradient: 'bg-gradient-to-r from-amber-500/90 to-orange-500',
        icon: <AlertTriangle className="w-5 h-5" />,
        showButton: true,
        showDismiss: true,
      };

    case 'needs-activation':
      return {
        title: 'Ative as notificações!',
        description: 'Receba alertas quando um novo lead for atribuído a você, mesmo com o app fechado.',
        buttonText: 'Ativar Notificações',
        loadingText: 'Ativando...',
        gradient: 'bg-gradient-to-r from-primary/90 to-primary',
        icon: <Bell className="w-5 h-5" />,
        showButton: true,
        showDismiss: false,
      };

    default:
      return null;
  }
}

export function NotificationPromptBanner() {
  const auth = useAuth();
  const user = auth?.user;
  const { permission, requestPermission, isSupported, subscription } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [hasDbSubscription, setHasDbSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!error) setHasDbSubscription(!!data);
      } catch (error) {
        console.error('Erro ao verificar subscription:', error);
      }
    };
    checkSubscription();
  }, [user]);

  useEffect(() => {
    const dismissedAt = localStorage.getItem('notification_banner_dismissed');
    if (dismissedAt && hasDbSubscription === true) {
      const hoursElapsed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursElapsed < 24) {
        setDismissed(true);
      } else {
        localStorage.removeItem('notification_banner_dismissed');
        setDismissed(false);
      }
    } else if (hasDbSubscription === false) {
      setDismissed(false);
      localStorage.removeItem('notification_banner_dismissed');
    }
  }, [hasDbSubscription]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification_banner_dismissed', Date.now().toString());
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const success = await requestPermission();
      if (success) setHasDbSubscription(true);
    } finally {
      setLoading(false);
    }
  };

  const blockReason = detectBlockReason(isSupported, permission, hasDbSubscription, subscription);

  // Don't show if no user, still loading DB check, dismissed, or no block reason
  if (!user || hasDbSubscription === null || dismissed || !blockReason) return null;

  const content = getBlockContent(blockReason);
  if (!content) return null;

  return (
    <div className={`${content.gradient} text-white rounded-lg p-4 mx-4 mb-4 shadow-lg animate-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
          {content.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{content.title}</h3>
          <p className="text-xs opacity-90 mb-3">{content.description}</p>
          
          {content.showButton && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleEnableNotifications}
                disabled={loading}
                className="text-xs h-8 bg-white text-primary hover:bg-white/90"
              >
                {loading ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin">⏳</span>
                    {content.loadingText}
                  </span>
                ) : (
                  <>
                    <Bell className="w-3 h-3 mr-1" />
                    {content.buttonText}
                  </>
                )}
              </Button>
              
              {content.showDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-xs h-8 text-white/80 hover:text-white hover:bg-white/10"
                >
                  Agora não
                </Button>
              )}
            </div>
          )}
        </div>
        
        {content.showDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
