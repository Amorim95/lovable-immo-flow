import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeadExportData {
  id: string;
  nome: string;
  telefone: string;
  created_at: string;
  user_id?: string;
  user?: {
    name: string;
    equipe_id?: string;
  };
  lead_tag_relations?: {
    tag_id: string;
  }[];
}

export function useRepiquesExport() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          created_at,
          user_id,
          user:users!leads_user_id_fkey(name, equipe_id),
          lead_tag_relations(tag_id)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por company_id (RLS já garante isso, mas adicionar explicitamente)
      if (!user.is_super_admin && user.company_id) {
        query = query.eq('company_id', user.company_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      setError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [user]);

  return {
    leads,
    loading,
    error,
    refreshLeads: loadLeads
  };
}
