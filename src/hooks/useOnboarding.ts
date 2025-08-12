import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserRole } from '@/hooks/useUserRole';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { settings } = useCompany();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    // Só verificar para admins
    if (!isAdmin || hasChecked) return;

    // Verificar se a empresa precisa de onboarding
    // (nome vazio ou apenas configurações padrão)
    const needsOnboarding = !settings.name || settings.name.trim() === '';

    if (needsOnboarding) {
      // Pequeno delay para garantir que o contexto foi carregado
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        setHasChecked(true);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setHasChecked(true);
    }
  }, [isAdmin, settings.name, hasChecked]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setHasChecked(true);
  };

  return {
    showOnboarding,
    completeOnboarding
  };
}