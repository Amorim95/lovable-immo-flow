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
        .select('id, etapa, created_at, user_id, primeiro_contato_whatsapp, primeira_visualizacao');

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

        // Calcular tempo médio de abertura (em horas)
        const leadsComVisualizacao = userLeads.filter(lead => lead.primeira_visualizacao);
        let tempoMedioAbertura = 0;
        
        if (leadsComVisualizacao.length > 0) {
          const temposAbertura = leadsComVisualizacao.map(lead => {
            const created = new Date(lead.created_at);
            const visualizacao = new Date(lead.primeira_visualizacao);
            return (visualizacao.getTime() - created.getTime()) / (1000 * 60 * 60); // Converter para horas
          });
          
          const somaTemposAbertura = temposAbertura.reduce((acc, tempo) => acc + tempo, 0);
          tempoMedioAbertura = Number((somaTemposAbertura / temposAbertura.length).toFixed(1));
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
        // Critério 1: Tempo de Abertura (peso 70% - quanto menor, melhor)
        // Normalizar usando tempo máximo encontrado + epsilon para evitar divisão por zero
        const tempoMaximo = Math.max(...corretoresPerformance.map(c => c.tempoMedioAbertura)) || 1;
        const pontuacaoTempo = corretor.tempoMedioAbertura > 0 
          ? (tempoMaximo - corretor.tempoMedioAbertura) / tempoMaximo * 100
          : 0; // Se não tem tempo de abertura, pontuação 0
        
        // Critério 2: Taxa de Conversão (peso 30% - quanto maior, melhor)
        const pontuacaoConversao = corretor.conversao;
        
        // Pontuação final ponderada
        const pontuacaoFinal = (pontuacaoTempo * 0.7) + (pontuacaoConversao * 0.3);
        
        return {
          ...corretor,
          pontuacaoFinal: Number(pontuacaoFinal.toFixed(2))
        };
      });

      // Ordenar por pontuação (decrescente) e pegar top 5
      const ranking = corretoresComPontuacao
        .filter(c => c.leadsRecebidos > 0) // Só considera corretores que receberam leads
        .sort((a, b) => b.pontuacaoFinal - a.pontuacaoFinal)
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