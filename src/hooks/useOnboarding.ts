import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { settings } = useCompany();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    if (hasChecked) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar dados do usuário incluindo role e status do onboarding
      const { data: userData } = await supabase
        .from('users')
        .select('role, has_completed_onboarding, company_id')
        .eq('id', user.id)
        .single();

      console.log('Dados do usuário para onboarding:', userData);

      // Só mostrar onboarding para usuários com role "dono" que não completaram ainda
      const shouldShowOnboarding = userData?.role === 'dono' && 
                                  !userData?.has_completed_onboarding &&
                                  (!settings.name || settings.name.trim() === '');

      if (shouldShowOnboarding) {
        // Pequeno delay para garantir que o contexto foi carregado
        const timer = setTimeout(() => {
          setShowOnboarding(true);
          setHasChecked(true);
        }, 1500);

        return () => clearTimeout(timer);
      } else {
        setHasChecked(true);
      }
    } catch (error) {
      console.error('Erro ao verificar status do onboarding:', error);
      setHasChecked(true);
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setHasChecked(true);
  };

  return {
    showOnboarding,
    completeOnboarding
  };
}