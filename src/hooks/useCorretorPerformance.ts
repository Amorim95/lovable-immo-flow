import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CorretorPerformance {
  id: string;
  nome: string;
  leadsRecebidos: number;
  vendasFechadas: number;
  tempoMedioResposta: number;
  conversao: number;
  aguardandoAtendimento: number;
  tentativasContato: number;
  atendeu: number;
  visita: number;
  vendas: number;
  pausa: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

export function useCorretorPerformance(corretorId?: string, dateRange?: DateRange) {
  const { user } = useAuth();
  const [corretores, setCorretores] = useState<CorretorPerformance[]>([]);
  const [selectedCorretor, setSelectedCorretor] = useState<CorretorPerformance | null>(null);
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

      // 1. Buscar todos os usuários ativos
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, equipe_id')
        .eq('status', 'ativo')
        .in('role', ['corretor', 'gestor', 'admin']);

      if (usersError) throw usersError;

      // 2. Buscar todos os leads no período (se especificado)
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

      // 3. Calcular métricas por corretor
      const corretoresPerformance: CorretorPerformance[] = usersData?.map(user => {
        const userLeads = leadsData?.filter(lead => lead.user_id === user.id) || [];
        
        const leadsRecebidos = userLeads.length;
        const aguardandoAtendimento = userLeads.filter(lead => lead.etapa === 'aguardando-atendimento').length;
        const tentativasContato = userLeads.filter(lead => lead.etapa === 'tentativas-contato').length;
        const atendeu = userLeads.filter(lead => lead.etapa === 'atendeu').length;
        const visita = userLeads.filter(lead => lead.etapa === 'visita').length;
        const vendas = userLeads.filter(lead => lead.etapa === 'vendas-fechadas').length;
        const pausa = userLeads.filter(lead => lead.etapa === 'em-pausa').length;
        
        const conversao = leadsRecebidos > 0 ? (vendas / leadsRecebidos) * 100 : 0;
        const tempoMedioResposta = Math.floor(Math.random() * 15) + 5; // Simulado por enquanto

        return {
          id: user.id,
          nome: user.name,
          leadsRecebidos,
          vendasFechadas: vendas,
          tempoMedioResposta,
          conversao: Number(conversao.toFixed(1)),
          aguardandoAtendimento,
          tentativasContato,
          atendeu,
          visita,
          vendas,
          pausa
        };
      }) || [];

      // Ordenar por conversão (decrescente)
      corretoresPerformance.sort((a, b) => b.conversao - a.conversao);

      setCorretores(corretoresPerformance);

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
    loading,
    error,
    refreshData: loadCorretorPerformance
  };
}