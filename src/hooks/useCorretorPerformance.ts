import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CorretorPerformance {
  id: string;
  nome: string;
  status: string;
  leadsRecebidos: number;
  vendasFechadas: number;
  tempoMedioResposta: number;
  tempoMedioAbertura: number;
  conversao: number;
  aguardandoAtendimento: number;
  tentativasContato: number;
  atendeu: number;
  nomeSujo: number;
  nomeLimpo: number;
  visita: number;
  vendas: number;
  pausa: number;
  descarte: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

export function useCorretorPerformance(corretorId?: string, dateRange?: DateRange) {
  const { user } = useAuth();
  const [corretores, setCorretores] = useState<CorretorPerformance[]>([]);
  const [selectedCorretor, setSelectedCorretor] = useState<CorretorPerformance | null>(null);
  const [rankingCorretores, setRankingCorretores] = useState<CorretorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadCorretorPerformance();
  }, [user, dateRange]);

  useEffect(() => {
    if (corretorId && corretores.length > 0) {
      const corretor = corretores.find(c => c.id === corretorId);
      setSelectedCorretor(corretor || corretores[0]);
    } else if (corretores.length > 0) {
      setSelectedCorretor(corretores[0]);
    }
  }, [corretorId, corretores]);

  const loadCorretorPerformance = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Buscar todos os usuários (ativos e inativos)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, equipe_id, status')
        .in('role', ['corretor', 'gestor', 'admin']);

      if (usersError) throw usersError;

      // 2. Buscar todos os leads no período (se especificado)
      let leadsQuery = supabase
        .from('leads')
        .select('id, etapa, created_at, user_id, primeiro_contato_whatsapp, primeira_visualizacao, atividades');

      if (dateRange?.from && dateRange?.to) {
        leadsQuery = leadsQuery
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;

      if (leadsError) throw leadsError;

      // 3. Calcular métricas por corretor
      const corretoresPerformance: CorretorPerformance[] = usersData?.map(user => {
        const userLeads = leadsData?.filter(lead => lead.user_id === user.id) || [];
        
        const leadsRecebidos = userLeads.length;
        const aguardandoAtendimento = userLeads.filter(lead => lead.etapa === 'aguardando-atendimento').length;
        const tentativasContato = userLeads.filter(lead => lead.etapa === 'tentativas-contato').length;
        const atendeu = userLeads.filter(lead => lead.etapa === 'atendeu').length;
        const nomeSujo = userLeads.filter(lead => lead.etapa === 'nome-sujo').length;
        const nomeLimpo = userLeads.filter(lead => lead.etapa === 'nome-limpo').length;
        const visita = userLeads.filter(lead => lead.etapa === 'visita').length;
        const vendas = userLeads.filter(lead => lead.etapa === 'vendas-fechadas').length;
        const pausa = userLeads.filter(lead => lead.etapa === 'em-pausa').length;
        const descarte = userLeads.filter(lead => lead.etapa === 'descarte').length;
        
        const conversao = leadsRecebidos > 0 ? (vendas / leadsRecebidos) * 100 : 0;
        
        // Calcular tempo médio de resposta real (em horas)
        const leadsComTempo = userLeads.filter(lead => lead.primeiro_contato_whatsapp);
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

        // Calcular tempo médio de abertura baseado na atividade "Lead visualizado" (em horas)
        const leadsComVisualizacao = userLeads.filter(lead => {
          if (!lead.atividades) return false;
          const atividades = lead.atividades as any[];
          if (!Array.isArray(atividades)) return false;
          return atividades.some((atividade: any) => atividade.descricao === "Lead visualizado");
        });
        
        let tempoMedioAbertura = 0;
        
        if (leadsComVisualizacao.length > 0) {
          const temposAbertura = leadsComVisualizacao.map(lead => {
            const created = new Date(lead.created_at);
            const atividades = lead.atividades as any[];
            
            // Encontrar todas as atividades de "Lead visualizado" e pegar a mais antiga (primeira visualização)
            const atividadesVisualizacao = atividades?.filter((atividade: any) => 
              atividade.descricao === "Lead visualizado"
            ).sort((a: any, b: any) => {
              const dataA = new Date(a.data);
              const dataB = new Date(b.data);
              return dataA.getTime() - dataB.getTime(); // Ordenar da mais antiga para a mais recente
            });
            
            if (!atividadesVisualizacao || atividadesVisualizacao.length === 0) return 0;
            
            // Pegar a primeira visualização (mais antiga)
            const primeiraVisualizacao = atividadesVisualizacao[0];
            const visualizacao = new Date(primeiraVisualizacao.data);
            
            // Validar se a data é válida
            if (isNaN(visualizacao.getTime()) || visualizacao < created) {
              console.warn(`Data de visualização inválida para lead ${lead.id}:`, primeiraVisualizacao.data);
              return 0;
            }
            
            return (visualizacao.getTime() - created.getTime()) / (1000 * 60 * 60); // Converter para horas
          }).filter(tempo => tempo > 0); // Filtrar tempos válidos
          
          if (temposAbertura.length > 0) {
            const somaTemposAbertura = temposAbertura.reduce((acc, tempo) => acc + tempo, 0);
            tempoMedioAbertura = Number((somaTemposAbertura / temposAbertura.length).toFixed(1));
          }
        }

        return {
          id: user.id,
          nome: user.name,
          status: user.status,
          leadsRecebidos,
          vendasFechadas: vendas,
          tempoMedioResposta,
          tempoMedioAbertura,
          conversao: Number(conversao.toFixed(1)),
          aguardandoAtendimento,
          tentativasContato,
          atendeu,
          nomeSujo,
          nomeLimpo,
          visita,
          vendas,
          pausa,
          descarte
        };
      }) || [];

      // Calcular ranking baseado em critérios ponderados
      const corretoresComPontuacao = corretoresPerformance.map(corretor => {
        // Critério 1: Tempo de Abertura (peso 50% - quanto menor, melhor)
        let pontuacaoTempoAbertura = 0;
        if (corretor.tempoMedioAbertura > 0) {
          const tempoMinimo = Math.min(...corretoresPerformance.filter(c => c.tempoMedioAbertura > 0).map(c => c.tempoMedioAbertura)) || 1;
          const tempoMaximo = Math.max(...corretoresPerformance.map(c => c.tempoMedioAbertura)) || 1;
          
          if (tempoMaximo > tempoMinimo) {
            pontuacaoTempoAbertura = 100 - ((corretor.tempoMedioAbertura - tempoMinimo) / (tempoMaximo - tempoMinimo)) * 100;
          } else {
            pontuacaoTempoAbertura = 100;
          }
        }
        
        // Critério 2: Tempo Médio Resposta (peso 30% - quanto menor, melhor)
        let pontuacaoTempoResposta = 0;
        if (corretor.tempoMedioResposta > 0) {
          const tempoMinimoResposta = Math.min(...corretoresPerformance.filter(c => c.tempoMedioResposta > 0).map(c => c.tempoMedioResposta)) || 1;
          const tempoMaximoResposta = Math.max(...corretoresPerformance.map(c => c.tempoMedioResposta)) || 1;
          
          if (tempoMaximoResposta > tempoMinimoResposta) {
            pontuacaoTempoResposta = 100 - ((corretor.tempoMedioResposta - tempoMinimoResposta) / (tempoMaximoResposta - tempoMinimoResposta)) * 100;
          } else {
            pontuacaoTempoResposta = 100;
          }
        }
        
        // Critério 3: Taxa de Conversão (peso 20% - quanto maior, melhor)
        const pontuacaoConversao = corretor.conversao;
        
        // Pontuação final ponderada
        const pontuacaoFinal = (pontuacaoTempoAbertura * 0.5) + (pontuacaoTempoResposta * 0.3) + (pontuacaoConversao * 0.2);
        
        return {
          ...corretor,
          pontuacaoFinal: Number(pontuacaoFinal.toFixed(2))
        };
      });

      // Ordenar por pontuação (decrescente) e pegar top 5
      const ranking = corretoresComPontuacao
        .filter(c => c.leadsRecebidos > 0) // Só considera corretores que receberam leads
        .sort((a, b) => {
          if (b.pontuacaoFinal !== a.pontuacaoFinal) {
            return b.pontuacaoFinal - a.pontuacaoFinal;
          }
          // Em caso de empate, priorizar menor tempo de abertura
          if (a.tempoMedioAbertura > 0 && b.tempoMedioAbertura > 0) {
            return a.tempoMedioAbertura - b.tempoMedioAbertura;
          }
          if (a.tempoMedioAbertura > 0 && b.tempoMedioAbertura === 0) return -1;
          if (b.tempoMedioAbertura > 0 && a.tempoMedioAbertura === 0) return 1;
          return b.conversao - a.conversao;
        })
        .slice(0, 5);

      // Ordenar corretores por conversão (decrescente) para exibição geral
      corretoresPerformance.sort((a, b) => b.conversao - a.conversao);

      setCorretores(corretoresPerformance);
      setRankingCorretores(ranking);

    } catch (error) {
      console.error('Error loading corretor performance:', error);
      setError('Erro ao carregar performance dos corretores');
    } finally {
      setLoading(false);
    }
  };

  return {
    corretores,
    selectedCorretor,
    rankingCorretores,
    loading,
    error,
    refreshData: loadCorretorPerformance
  };
}