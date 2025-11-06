import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useManagerTeam() {
  const { user } = useAuth();
  const [managedTeamId, setManagedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkManagedTeam = async () => {
      try {
        // Buscar equipe onde o usuário é responsável
        const { data, error } = await supabase
          .from('equipes')
          .select('id')
          .eq('responsavel_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking managed team:', error);
        } else if (data) {
          setManagedTeamId(data.id);
        }
      } catch (error) {
        console.error('Error checking managed team:', error);
      } finally {
        setLoading(false);
      }
    };

    checkManagedTeam();
  }, [user]);

  return { managedTeamId, loading };
}
