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
    lead_tags?: {
      nome: string;
    };
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

      // Buscar TODOS os leads usando paginação
      const allLeads: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
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
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        // Filtrar por company_id
        if (!user.is_super_admin && user.company_id) {
          query = query.eq('company_id', user.company_id);
        }

        const { data, error: queryError, count } = await query;

        if (queryError) throw queryError;

        if (data && data.length > 0) {
          allLeads.push(...data);
          from += pageSize;
          
          // Verificar se há mais dados
          if (count && allLeads.length >= count) {
            hasMore = false;
          }
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log('Total de leads carregados:', allLeads.length);

      // Buscar tags separadamente (não bloqueia se falhar)
      let leadTagMap: Record<string, Array<{ tag_id: string; lead_tags?: { nome: string } }>> = {};
      
      try {
        // Buscar tags em lotes para evitar URL gigante (Failed to fetch com muitos IDs)
        const leadIds = allLeads.map(l => l.id);
        const TAG_BATCH_SIZE = 200;

        for (let i = 0; i < leadIds.length; i += TAG_BATCH_SIZE) {
          const batch = leadIds.slice(i, i + TAG_BATCH_SIZE);
          const { data: tagRelations, error: tagErr } = await supabase
            .from('lead_tag_relations')
            .select('lead_id, tag_id, lead_tags(nome)')
            .in('lead_id', batch);

          if (tagErr) {
            console.warn(`Erro ao carregar tags do lote ${i}:`, tagErr);
            continue;
          }

          tagRelations?.forEach(rel => {
            if (!leadTagMap[rel.lead_id]) {
              leadTagMap[rel.lead_id] = [];
            }
            leadTagMap[rel.lead_id].push({
              tag_id: rel.tag_id,
              lead_tags: rel.lead_tags
            });
          });
        }
      } catch (tagError) {
        console.warn('Erro ao carregar tags (não crítico):', tagError);
        // Continua mesmo se tags falharem
      }

      // Combinar dados
      const enrichedLeads = allLeads.map(lead => ({
        ...lead,
        lead_tag_relations: leadTagMap[lead.id] || []
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
