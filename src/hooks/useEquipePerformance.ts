import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EquipePerformance {
  id: string;
  nome: string;
  leadsTotais: number;
  visitas: number;
  vendas: number;
  tempoMedioResposta: number;
  conversao: number;
  aguardandoAtendimento: number;
  tentativasContato: number;
  atendeu: number;
  visita: number;
  vendasFechadas: number;
  pausa: number;
  ranking?: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

export function useEquipePerformance(equipeId?: string, dateRange?: DateRange) {
  const { user } = useAuth();
  const [equipes, setEquipes] = useState<EquipePerformance[]>([]);
  const [selectedEquipe, setSelectedEquipe] = useState<EquipePerformance | null>(null);
  const [rankingEquipes, setRankingEquipes] = useState<EquipePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadEquipePerformance();
  }, [user, dateRange]);

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

      // 3. Buscar todos os leads no período
      let leadsQuery = supabase
        .from('leads')
        .select('id, etapa, created_at, user_id');

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
        const aguardandoAtendimento = equipeLeads.filter(lead => lead.etapa === 'aguardando-atendimento').length;
        const tentativasContato = equipeLeads.filter(lead => lead.etapa === 'tentativas-contato').length;
        const atendeu = equipeLeads.filter(lead => lead.etapa === 'atendeu').length;
        const visita = equipeLeads.filter(lead => lead.etapa === 'visita').length;
        const vendas = equipeLeads.filter(lead => lead.etapa === 'vendas-fechadas').length;
        const pausa = equipeLeads.filter(lead => lead.etapa === 'em-pausa').length;

        const conversao = leadsTotais > 0 ? (vendas / leadsTotais) * 100 : 0;
        const tempoMedioResposta = Math.floor(Math.random() * 20) + 8; // Simulado

        return {
          id: equipe.id,
          nome: equipe.nome,
          leadsTotais,
          visitas: visita,
          vendas,
          tempoMedioResposta,
          conversao: Number(conversao.toFixed(1)),
          aguardandoAtendimento,
          tentativasContato,
          atendeu,
          visita,
          vendasFechadas: vendas,
          pausa
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