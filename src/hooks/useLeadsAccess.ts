
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface LeadsData {
  id: string;
  nome: string;
  telefone: string;
  dados_adicionais?: string;
  etapa: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  user?: {
    name: string;
    equipe_id?: string;
  };
  lead_tag_relations?: {
    lead_tags: {
      id: string;
      nome: string;
      cor: string;
    };
  }[];
}

export function useLeadsAccess() {
  const { user } = useAuth();
  const { isAdmin, isGestor, isCorretor, loading: roleLoading } = useUserRole();
  const [leads, setLeads] = useState<LeadsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || roleLoading) return;
    loadLeads();
  }, [user, isAdmin, isGestor, isCorretor, roleLoading]);

  const loadLeads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leads')
        .select(`
          id,
          nome,
          telefone,
          dados_adicionais,
          etapa,
          created_at,
          updated_at,
          user_id,
          user:users(name, equipe_id),
          lead_tag_relations(
            lead_tags(
              id,
              nome,
              cor
            )
          )
        `)
        .order('created_at', { ascending: false });

      // As políticas RLS já filtram automaticamente baseado no papel do usuário
      // Admins veem todos os leads
      // Gestores veem leads da sua equipe
      // Corretores veem apenas seus próprios leads

      const { data, error } = await query;

      if (error) {
        console.error('Error loading leads:', error);
        setError('Erro ao carregar leads');
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      setError('Erro interno ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const refreshLeads = () => {
    loadLeads();
  };

  return {
    leads,
    loading,
    error,
    refreshLeads,
    canCreateLeads: isAdmin || isGestor || isCorretor,
    canAssignLeads: isAdmin || isGestor,
    canViewAllLeads: isAdmin,
    canViewTeamLeads: isAdmin || isGestor
  };
}
