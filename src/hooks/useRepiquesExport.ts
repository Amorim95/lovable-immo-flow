import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeadExportData {
  id: string;
  nome: string;
  telefone: string;
  created_at: string;
  user_id?: string;
  stage_name?: string;
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

      // Query principal (SEM lead_tag_relations)
      let query = supabase
        .from('leads')
        .select(`
          id,
          nome,
          telefone,
          created_at,
          user_id,
          stage_name,
          user:users!leads_user_id_fkey(name, equipe_id)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por company_id (RLS já garante isso, mas adicionar explicitamente)
      if (!user.is_super_admin && user.company_id) {
        query = query.eq('company_id', user.company_id);
      }

      const { data: leadsData, error: leadsError } = await query;

      if (leadsError) throw leadsError;

      // Buscar tags separadamente (não bloqueia se falhar)
      let leadTagMap: Record<string, string[]> = {};
      
      try {
        const { data: tagRelations } = await supabase
          .from('lead_tag_relations')
          .select('lead_id, tag_id')
          .in('lead_id', leadsData?.map(l => l.id) || []);
        
        // Criar mapa lead_id -> [tag_ids]
        tagRelations?.forEach(rel => {
          if (!leadTagMap[rel.lead_id]) {
            leadTagMap[rel.lead_id] = [];
          }
          leadTagMap[rel.lead_id].push(rel.tag_id);
        });
      } catch (tagError) {
        console.warn('Erro ao carregar tags (não crítico):', tagError);
        // Continua mesmo se tags falharem
      }

      // Combinar dados
      const enrichedLeads = (leadsData || []).map(lead => ({
        ...lead,
        lead_tag_relations: (leadTagMap[lead.id] || []).map(tag_id => ({ tag_id }))
      }));

      setLeads(enrichedLeads);
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
