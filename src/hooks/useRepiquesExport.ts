import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeadExportData {
  id: string;
  nome: string;
  telefone: string;
  created_at: string;
  user_id?: string;
  stage_name?: string;
  equipe_id?: string;
  lead_tag_relations?: {
    tag_id: string;
    lead_tags?: {
      nome: string;
    };
  }[];
}

interface DateRange {
  from: Date;
  to: Date;
}

export function useRepiquesExport(dateRange: DateRange | null) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const allLeads: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('leads')
          .select('id, nome, telefone, created_at, user_id, stage_name', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (!user.is_super_admin && user.company_id) {
          query = query.eq('company_id', user.company_id);
        }

        if (dateRange) {
          query = query
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString());
        }

        const { data, error: queryError, count } = await query;

        if (queryError) throw queryError;

        if (data && data.length > 0) {
          allLeads.push(...data);
          from += pageSize;
          if (count && allLeads.length >= count) hasMore = false;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      console.log('Total de leads carregados:', allLeads.length);

      setLeads(allLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
      setError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [user, dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  // Buscar tags + equipe sob demanda (apenas no momento da exportação)
  const enrichLeadsForExport = useCallback(async (leadsToEnrich: LeadExportData[]) => {
    if (leadsToEnrich.length === 0) return leadsToEnrich;

    const leadIds = leadsToEnrich.map(l => l.id);
    const userIds = Array.from(new Set(leadsToEnrich.map(l => l.user_id).filter(Boolean))) as string[];
    const BATCH = 200;

    // Buscar tags em lotes
    const tagMap: Record<string, Array<{ tag_id: string; lead_tags?: { nome: string } }>> = {};
    try {
      for (let i = 0; i < leadIds.length; i += BATCH) {
        const batch = leadIds.slice(i, i + BATCH);
        const { data } = await supabase
          .from('lead_tag_relations')
          .select('lead_id, tag_id, lead_tags(nome)')
          .in('lead_id', batch);

        data?.forEach(rel => {
          if (!tagMap[rel.lead_id]) tagMap[rel.lead_id] = [];
          tagMap[rel.lead_id].push({ tag_id: rel.tag_id, lead_tags: rel.lead_tags });
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar tags na exportação:', e);
    }

    // Buscar equipe_id dos usuários (necessário para filtro de equipe na exportação)
    const userEquipeMap: Record<string, string | undefined> = {};
    try {
      for (let i = 0; i < userIds.length; i += BATCH) {
        const batch = userIds.slice(i, i + BATCH);
        const { data } = await supabase
          .from('users')
          .select('id, equipe_id')
          .in('id', batch);
        data?.forEach(u => { userEquipeMap[u.id] = u.equipe_id || undefined; });
      }
    } catch (e) {
      console.warn('Erro ao carregar equipes na exportação:', e);
    }

    return leadsToEnrich.map(l => ({
      ...l,
      equipe_id: l.user_id ? userEquipeMap[l.user_id] : undefined,
      lead_tag_relations: tagMap[l.id] || [],
    }));
  }, []);

  return {
    leads,
    loading,
    error,
    refreshLeads: loadLeads,
    enrichLeadsForExport,
  };
}
