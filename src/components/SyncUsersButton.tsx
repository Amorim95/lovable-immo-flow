import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SyncUsersButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      console.log('Iniciando sincronização de usuários...');
      
      const { data, error } = await supabase.functions.invoke('sync-all-users-to-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Erro na sincronização:', error);
        toast.error(`Erro: ${error.message}`);
        return;
      }

      console.log('Resultado da sincronização:', data);

      if (data.success) {
        const { results } = data;
        
        toast.success(
          `Sincronização concluída!\n` +
          `✓ ${results.created.length} usuários criados\n` +
          `✓ ${results.alreadyExists.length} já existiam\n` +
          `${results.errors.length > 0 ? `⚠️ ${results.errors.length} erros` : ''}`
        );

        if (results.created.length > 0) {
          console.log('Usuários criados:', results.created);
        }

        if (results.errors.length > 0) {
          console.error('Erros encontrados:', results.errors);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar usuários:', error);
      toast.error('Erro ao sincronizar usuários');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Sincronizando...' : 'Sincronizar Usuários'}
    </Button>
  );
}
