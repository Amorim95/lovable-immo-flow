import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadStages } from './useLeadStages';

interface EquipePerformance {
  id: string;
  nome: string;
  leadsTotais: number;
  visitas: number;
  vendas: number;
  tempoMedioResposta: number;
  conversao: number;
  leadsPorEtapa: { [key: string]: number };
  etiquetasPorEtapa: { [etapa: string]: { [etiqueta: string]: number } };
  totalPorEtiqueta: { [etiqueta: string]: number };
  ranking?: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

export function useEquipePerformance(equipeId?: string, dateRange?: DateRange) {
  const { user } = useAuth();
  const { stages } = useLeadStages();
  const [equipes, setEquipes] = useState<EquipePerformance[]>([]);
  const [selectedEquipe, setSelectedEquipe] = useState<EquipePerformance | null>(null);
  const [rankingEquipes, setRankingEquipes] = useState<EquipePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || stages.length === 0) return;
    loadEquipePerformance();
  }, [user, dateRange, stages]);

  useEffect(() => {
    if (equipeId && equipes.length > 0) {
      const equipe = equipes.find(e => e.id === equipeId);
      setSelectedEquipe(equipe || equipes[0]);
    } else if (equipes.length > 0) {
      setSelectedEquipe(equipes[0]);
    }
  }, [equipeId, equipes]);

  const loadEquipePerformance = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Buscar todas as equipes
      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes')
        .select('id, nome');

      if (equipesError) throw equipesError;

      // 2. Buscar todos os usuários
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, equipe_id')
        .eq('status', 'ativo');

      if (usersError) throw usersError;

      // 3. Buscar todos os leads no período com suas etiquetas
      let leadsQuery = supabase
        .from('leads')
        .select(`
          id, 
          etapa, 
          stage_name, 
          created_at, 
          user_id, 
          primeiro_contato_whatsapp,
          lead_tag_relations (
            tag_id,
            lead_tags (
              id,
              nome,
              cor
            )
          )
        `);

      if (dateRange?.from && dateRange?.to) {
        leadsQuery = leadsQuery
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;

      if (leadsError) throw leadsError;

      // 4. Calcular métricas por equipe
      const equipesPerformance: EquipePerformance[] = equipesData?.map(equipe => {
        // Buscar usuários da equipe
        const equipeUsers = usersData?.filter(user => user.equipe_id === equipe.id) || [];
        
        // Buscar leads da equipe
        const equipeLeads = leadsData?.filter(lead => 
          equipeUsers.some(user => user.id === lead.user_id)
        ) || [];

        const leadsTotais = equipeLeads.length;
        
        // Calcular leads por etapa usando as etapas dinâmicas
        const leadsPorEtapa: { [key: string]: number } = {};
        stages.forEach(stage => {
          const count = equipeLeads.filter(lead => {
            if (lead.stage_name) {
              return lead.stage_name === stage.nome;
            }
            // Fallback para compatibilidade
            return stage.legacy_key && lead.etapa === stage.legacy_key;
          }).length;
          leadsPorEtapa[stage.nome] = count;
        });
        
        // Encontrar etapa de vendas/sucesso da empresa
        const vendaStage = stages.find(s => 
          s.nome.toLowerCase().includes('venda') || 
          s.nome.toLowerCase().includes('fechada') ||
          s.legacy_key === 'vendas-fechadas'
        );
        
        const vendas = equipeLeads.filter(lead => {
          if (lead.stage_name && vendaStage) {
            return lead.stage_name === vendaStage.nome;
          }
          return lead.etapa === 'vendas-fechadas';
        }).length;
        
        // Encontrar etapa de visita da empresa
        const visitaStage = stages.find(s => 
          s.nome.toLowerCase().includes('visita') ||
          s.legacy_key === 'visita'
        );
        
        const visitas = equipeLeads.filter(lead => {
          if (lead.stage_name && visitaStage) {
            return lead.stage_name === visitaStage.nome;
          }
          return lead.etapa === 'visita';
        }).length;

        const conversao = leadsTotais > 0 ? (vendas / leadsTotais) * 100 : 0;
        
        // Calcular tempo médio de resposta real (em horas)
        const leadsComTempo = equipeLeads.filter(lead => lead.primeiro_contato_whatsapp);
        let tempoMedioResposta = 0;
        
        if (leadsComTempo.length > 0) {
          const temposResposta = leadsComTempo.map(lead => {
            const created = new Date(lead.created_at);
            const resposta = new Date(lead.primeiro_contato_whatsapp);
            return (resposta.getTime() - created.getTime()) / (1000 * 60 * 60); // Converter para horas
          });
          
          const somaTempos = temposResposta.reduce((acc, tempo) => acc + tempo, 0);
          tempoMedioResposta = Number((somaTempos / temposResposta.length).toFixed(1));
        }

        // Calcular métricas de etiquetas para esta equipe
        const etiquetasPorEtapa: { [etapa: string]: { [etiqueta: string]: number } } = {};
        const totalPorEtiqueta: { [etiqueta: string]: number } = {};

        // Inicializar estrutura para todas as etapas
        stages.forEach(stage => {
          etiquetasPorEtapa[stage.nome] = {};
        });

        // Processar cada lead da equipe e suas etiquetas
        equipeLeads.forEach(lead => {
          const etapaNome = lead.stage_name || 
            stages.find(s => s.legacy_key === lead.etapa)?.nome || 
            lead.etapa;

          if (etapaNome && lead.lead_tag_relations) {
            lead.lead_tag_relations.forEach((relation: any) => {
              if (relation.lead_tags) {
                const etiquetaNome = relation.lead_tags.nome;
                
                // Contar por etapa
                if (!etiquetasPorEtapa[etapaNome]) {
                  etiquetasPorEtapa[etapaNome] = {};
                }
                if (!etiquetasPorEtapa[etapaNome][etiquetaNome]) {
                  etiquetasPorEtapa[etapaNome][etiquetaNome] = 0;
                }
                etiquetasPorEtapa[etapaNome][etiquetaNome]++;

                // Contar total geral
                if (!totalPorEtiqueta[etiquetaNome]) {
                  totalPorEtiqueta[etiquetaNome] = 0;
                }
                totalPorEtiqueta[etiquetaNome]++;
              }
            });
          }
        });

        return {
          id: equipe.id,
          nome: equipe.nome,
          leadsTotais,
          visitas,
          vendas,
          tempoMedioResposta,
          conversao: Number(conversao.toFixed(1)),
          leadsPorEtapa,
          etiquetasPorEtapa,
          totalPorEtiqueta
        };
      }) || [];

      // Ordenar por conversão para ranking
      const equipesComRanking = [...equipesPerformance]
        .sort((a, b) => b.conversao - a.conversao)
        .map((equipe, index) => ({
          ...equipe,
          ranking: index + 1
        }));

      setEquipes(equipesPerformance);
      setRankingEquipes(equipesComRanking.slice(0, 3)); // Top 3

    } catch (error) {
      console.error('Error loading equipe performance:', error);
      setError('Erro ao carregar performance das equipes');
    } finally {
      setLoading(false);
    }
  };

  return {
    equipes,
    selectedEquipe,
    rankingEquipes,
    loading,
    error,
    refreshData: loadEquipePerformance
  };
}