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
  // IMPORTANTE: Só respeitar dispensa se o usuário JÁ tem subscription no banco
  useEffect(() => {
    const dismissedAt = localStorage.getItem('notification_banner_dismissed');
    if (dismissedAt && hasDbSubscription === true) {
      // Só respeitar dispensa se usuário já ativou notificações antes
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const hoursElapsed = (now - dismissedTime) / (1000 * 60 * 60);
      
      // Se foi dispensado há menos de 24 horas, manter dispensado
      if (hoursElapsed < 24) {
        setDismissed(true);
      } else {
        // Limpar o localStorage após 24 horas
        localStorage.removeItem('notification_banner_dismissed');
        setDismissed(false);
      }
    } else if (hasDbSubscription === false) {
      // Se nunca ativou, NUNCA pode estar dispensado
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
  // 1. Navegador suporta notificações
  // 2. Usuário está logado
  // 3. Não foi dispensado
  // 4. Já verificamos o status no banco (não está carregando)
  // 5. NÃO tem uma subscription válida ativa
  const hasValidSubscription = subscription && permission === 'granted';
  
  // DEBUG LOGS - remover depois
  console.log('[NotificationBanner] DEBUG v1.1:', {
    isSupported,
    hasUser: !!user,
    userId: user?.id,
    dismissed,
    hasDbSubscription,
    hasDbSubscriptionIsNull: hasDbSubscription === null,
    hasValidSubscription,
    permission,
    subscriptionExists: !!subscription,
    needsReactivation
  });
  
  // Mostrar para todos que não têm subscription válida
  // hasDbSubscription === null significa que ainda está carregando
  // hasDbSubscription === false significa que nunca ativou
  // hasDbSubscription === true significa que tem no banco mas pode precisar reativar
  const shouldShow = isSupported && 
    user && 
    !dismissed && 
    hasDbSubscription !== null && // Já terminou de carregar
    !hasValidSubscription; // Não tem subscription ativa

  console.log('[NotificationBanner] shouldShow:', shouldShow, 'hasDbSubscription value:', hasDbSubscription);

  if (!shouldShow) {
    return null;
  }
  
  // Detectar se permissão foi negada (precisa de instruções especiais)
  const permissionDenied = permission === 'denied';

  // Estilo diferente para reativação ou permissão negada
  const isReactivation = needsReactivation && !permissionDenied;

  // Detectar ambiente para instruções específicas
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Determinar mensagem e estilo
  const getContent = () => {
    // Prioridade 1: Permissão bloqueada no navegador/dispositivo
    if (permissionDenied) {
      const instructions = isIOS
        ? 'Acesse Ajustes → Notificações → Safari/CRM.Imob e ative as notificações.'
        : isAndroid
        ? 'Toque no cadeado 🔒 na barra de endereço → Permissões → Notificações → Permitir.'
        : 'Clique no cadeado 🔒 na barra de endereço → Permissões → Notificações → Permitir.';
      
      return {
        title: '🔔 Notificações Bloqueadas',
        description: instructions,
        buttonText: 'Entendi',
        gradient: 'bg-gradient-to-r from-red-500/90 to-red-600',
        icon: <AlertTriangle className="w-5 h-5" />,
        showButton: false,
        showDismiss: true
      };
    }
    
    // Prioridade 2: Reativação necessária
    if (isReactivation) {
      return {
        title: '⚠️ Reative suas notificações!',
        description: 'Houve uma atualização no sistema. Por favor, reative as notificações para continuar recebendo alertas de novos leads.',
        buttonText: 'Reativar Agora',
        loadingText: 'Reativando...',
        gradient: 'bg-gradient-to-r from-amber-500/90 to-orange-500',
        icon: <AlertTriangle className="w-5 h-5" />,
        showButton: true,
        showDismiss: true
      };
    }
    
    // Prioridade 3: Primeira ativação
    return {
      title: 'Ative as notificações!',
      description: 'Receba alertas quando um novo lead for atribuído a você, mesmo com o app fechado.',
      buttonText: 'Ativar Notificações',
      loadingText: 'Ativando...',
      gradient: 'bg-gradient-to-r from-primary/90 to-primary',
      icon: <Bell className="w-5 h-5" />,
      showButton: true,
      showDismiss: false
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
              
              {/* Só mostrar "Agora não" se showDismiss = true */}
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
        
        {/* Mostrar X para fechar quando showDismiss = true e não tem botão de ação */}
        {content.showDismiss && !content.showButton && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* X para fechar quando showDismiss = true e tem botão */}
        {content.showDismiss && content.showButton && (
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