import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationPromptBanner() {
  const auth = useAuth();
  const user = auth?.user;
  const { permission, requestPermission, isSupported, subscription } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [hasDbSubscription, setHasDbSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar se o usuário já tem subscription no banco
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error) {
          setHasDbSubscription(!!data);
        }
      } catch (error) {
        console.error('Erro ao verificar subscription:', error);
      }
    };

    checkSubscription();
  }, [user]);

  // Verificar se foi dispensado recentemente (24h)
  useEffect(() => {
    const dismissedAt = localStorage.getItem('notification_banner_dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const hoursElapsed = (now - dismissedTime) / (1000 * 60 * 60);
      
      // Se foi dispensado há menos de 24 horas, manter dispensado
      if (hoursElapsed < 24) {
        setDismissed(true);
      } else {
        // Limpar o localStorage após 24 horas
        localStorage.removeItem('notification_banner_dismissed');
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification_banner_dismissed', Date.now().toString());
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const success = await requestPermission();
      if (success) {
        setHasDbSubscription(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Detectar se precisa reativar (tem no banco mas não tem subscription ativa no browser)
  const needsReactivation = hasDbSubscription && !subscription;
  
  // Mostrar banner se:
  // - Não tem subscription ativa E não foi dispensado
  // O banner só desaparece quando o usuário tiver uma subscription válida
  const hasValidSubscription = subscription && permission === 'granted';
  
  const shouldShow = isSupported && 
    user && 
    !dismissed && 
    hasDbSubscription !== null &&
    !hasValidSubscription;

  if (!shouldShow) {
    return null;
  }
  
  // Detectar se permissão foi negada (precisa de instruções especiais)
  const permissionDenied = permission === 'denied';

  // Estilo diferente para reativação ou permissão negada
  const isReactivation = needsReactivation;
  const showDeniedMessage = permissionDenied && !hasDbSubscription;

  // Determinar mensagem e estilo
  const getContent = () => {
    if (showDeniedMessage) {
      return {
        title: '🔔 Notificações Bloqueadas',
        description: 'As notificações foram bloqueadas. Para ativar, acesse as Configurações do seu navegador/dispositivo e permita notificações para este site.',
        buttonText: 'Entendi',
        gradient: 'bg-gradient-to-r from-red-500/90 to-red-600',
        icon: <AlertTriangle className="w-5 h-5" />,
        showButton: false
      };
    }
    if (isReactivation) {
      return {
        title: '⚠️ Reative suas notificações!',
        description: 'Houve uma atualização no sistema. Por favor, reative as notificações para continuar recebendo alertas de novos leads.',
        buttonText: 'Reativar Agora',
        loadingText: 'Reativando...',
        gradient: 'bg-gradient-to-r from-amber-500/90 to-orange-500',
        icon: <AlertTriangle className="w-5 h-5" />,
        showButton: true
      };
    }
    return {
      title: 'Ative as notificações!',
      description: 'Receba alertas quando um novo lead for atribuído a você, mesmo com o app fechado.',
      buttonText: 'Ativar Notificações',
      loadingText: 'Ativando...',
      gradient: 'bg-gradient-to-r from-primary/90 to-primary',
      icon: <Bell className="w-5 h-5" />,
      showButton: true
    };
  };

  const content = getContent();

  return (
    <div className={`${content.gradient} text-white rounded-lg p-4 mx-4 mb-4 shadow-lg animate-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
          {content.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            {content.title}
          </h3>
          <p className="text-xs opacity-90 mb-3">
            {content.description}
          </p>
          
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
              
              {!isReactivation && !showDeniedMessage && (
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
        
        {!isReactivation && !showDeniedMessage && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {showDeniedMessage && (
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