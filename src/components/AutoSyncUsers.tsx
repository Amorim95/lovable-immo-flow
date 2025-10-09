import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export function AutoSyncUsers() {
  const { user } = useAuth();
  const { isAdmin, isDono } = useUserRole();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Só executa uma vez e apenas para admins/donos
    if (!user || (!isAdmin && !isDono) || hasSynced.current) {
      return;
    }

    const syncUsers = async () => {
      try {
        console.log('🔄 Iniciando sincronização automática de usuários...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('❌ Sem sessão ativa');
          return;
        }

        // Chamar a edge function de sincronização
        const { data, error } = await supabase.functions.invoke('sync-all-users-to-auth', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) {
          console.error('❌ Erro na sincronização:', error);
          return;
        }

        if (data?.success && data?.results) {
          const { results } = data;
          
          if (results.created.length > 0) {
            console.log(`✅ ${results.created.length} usuários sincronizados com sucesso!`);
            console.log('Usuários criados:', results.created.map((u: any) => u.email));
          } else {
            console.log('✓ Todos os usuários já estão sincronizados');
          }

          if (results.errors.length > 0) {
            console.warn('⚠️ Alguns erros encontrados:', results.errors);
          }
        }

        hasSynced.current = true;
      } catch (error) {
        console.error('❌ Erro na sincronização automática:', error);
      }
    };

    // Executar após 2 segundos do login
    const timer = setTimeout(syncUsers, 2000);

    return () => clearTimeout(timer);
  }, [user, isAdmin, isDono]);

  return null; // Componente invisível
}
