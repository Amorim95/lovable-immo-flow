import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CompanyAccess {
  site_enabled: boolean;
  imoveis_enabled: boolean;
  dashboards_enabled: boolean;
}

export function useCompanyAccess() {
  const { user } = useAuth();

  const { data: accessControl, isLoading } = useQuery({
    queryKey: ['company-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Primeiro, obter o company_id do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.company_id) {
        console.error('Erro ao obter company_id:', userError);
        return null;
      }

      // Buscar o controle de acesso da empresa
      const { data: accessData, error: accessError } = await supabase
        .from('company_access_control')
        .select('site_enabled, imoveis_enabled, dashboards_enabled')
        .eq('company_id', userData.company_id)
        .single();

      if (accessError) {
        console.error('Erro ao obter controle de acesso:', accessError);
        // Retornar valores padrão se não houver registro
        return {
          site_enabled: true,
          imoveis_enabled: true,
          dashboards_enabled: true
        };
      }

      return accessData as CompanyAccess;
    },
    enabled: !!user?.id
  });

  return {
    accessControl: accessControl || {
      site_enabled: true,
      imoveis_enabled: true,
      dashboards_enabled: true
    },
    isLoading,
    hasSiteAccess: accessControl?.site_enabled ?? true,
    hasImoveisAccess: accessControl?.imoveis_enabled ?? true,
    hasDashboardsAccess: accessControl?.dashboards_enabled ?? true
  };
}