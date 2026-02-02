import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, Atividade } from '@/types/crm';

interface LeadData {
  id: string;
  nome: string;
  telefone: string;
  dados_adicionais?: string;
  etapa: string;
  stage_name?: string;
  created_at: string;
  user_id?: string;
  atividades?: any;
  primeira_visualizacao?: string;
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

export function useLeadById(id: string | undefined) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('leads')
        .select(`
          id,
          nome,
          telefone,
          dados_adicionais,
          etapa,
          stage_name,
          created_at,
          user_id,
          atividades,
          primeira_visualizacao,
          user:users(name, equipe_id),
          lead_tag_relations(
            lead_tags(
              id,
              nome,
              cor
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (queryError) {
        console.error('Erro ao buscar lead:', queryError);
        setError('Erro ao carregar lead');
        return;
      }

      if (!data) {
        setError('Lead não encontrado');
        return;
      }

      // Converter para o formato Lead
      const convertedLead: Lead = {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone,
        dadosAdicionais: data.dados_adicionais || '',
        campanha: 'Não especificada',
        conjunto: 'Não especificado',
        anuncio: 'Não especificado',
        dataCriacao: new Date(data.created_at),
        etapa: data.etapa as Lead['etapa'],
        stage_name: data.stage_name,
        etiquetas: data.lead_tag_relations?.map(rel => rel.lead_tags?.nome as Lead['etiquetas'][0]).filter(Boolean) || [],
        corretor: data.user?.name || 'Não atribuído',
        atividades: (Array.isArray(data.atividades) ? data.atividades : []).map((atividade: any) => ({
          id: atividade.id,
          tipo: atividade.tipo as Atividade['tipo'],
          descricao: atividade.descricao,
          data: new Date(atividade.data),
          corretor: atividade.corretor
        })),
        status: 'ativo',
        userId: data.user_id,
        primeira_visualizacao: data.primeira_visualizacao
      };

      setLead(convertedLead);
    } catch (err) {
      console.error('Erro ao buscar lead:', err);
      setError('Erro interno ao carregar lead');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const updateLead = (updates: Partial<Lead>) => {
    setLead(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshLead = () => {
    fetchLead();
  };

  return {
    lead,
    loading,
    error,
    updateLead,
    refreshLead
  };
}
