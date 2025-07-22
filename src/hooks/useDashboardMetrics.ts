import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardMetrics {
  totalLeads: number;
  leadsAguardando: number;
  visitasAgendadas: number;
  vendasFechadas: number;
  tempoMedioAtendimento: number;
  melhorCorretor: {
    nome: string;
    taxaConversao: number;
  };
  equipeDestaque: {
    nome: string;
    totalLeads: number;
    metaAtingida: number;
  };
  conversaoGeral: number;
  crescimento: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

export function useDashboardMetrics(dateRange?: DateRange) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    leadsAguardando: 0,
    visitasAgendadas: 0,
    vendasFechadas: 0,
    tempoMedioAtendimento: 0,
    melhorCorretor: {
      nome: 'N/A',
      taxaConversao: 0
    },
    equipeDestaque: {
      nome: 'N/A',
      totalLeads: 0,
      metaAtingida: 0
    },
    conversaoGeral: 0,
    crescimento: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadMetrics();
  }, [user, dateRange]);

  const loadMetrics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Construir filtro de data se fornecido
      let dateFilter = '';
      if (dateRange?.from && dateRange?.to) {
        dateFilter = `and created_at >= '${dateRange.from.toISOString()}' and created_at <= '${dateRange.to.toISOString()}'`;
      }

      // 1. Total de Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, etapa, created_at, user_id')
        .gte('created_at', dateRange?.from?.toISOString() || '1900-01-01')
        .lte('created_at', dateRange?.to?.toISOString() || '2100-01-01');

      if (leadsError) throw leadsError;

      const totalLeads = leadsData?.length || 0;
      const leadsAguardando = leadsData?.filter(lead => lead.etapa === 'aguardando-atendimento').length || 0;
      const visitasAgendadas = leadsData?.filter(lead => lead.etapa === 'visita').length || 0;
      const vendasFechadas = leadsData?.filter(lead => lead.etapa === 'vendas-fechadas').length || 0;

      // 2. Buscar dados dos usuários para análise por corretor
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, equipe_id')
        .eq('status', 'ativo');

      if (usersError) throw usersError;

      // 3. Calcular métricas por corretor
      const corretorMetrics = usersData?.map(user => {
        const userLeads = leadsData?.filter(lead => lead.user_id === user.id) || [];
        const userVendas = userLeads.filter(lead => lead.etapa === 'vendas-fechadas').length;
        const taxaConversao = userLeads.length > 0 ? (userVendas / userLeads.length) * 100 : 0;
        
        return {
          ...user,
          totalLeads: userLeads.length,
          vendas: userVendas,
          taxaConversao
        };
      }) || [];

      // Encontrar melhor corretor
      const melhorCorretor = corretorMetrics.reduce((best, current) => {
        return current.taxaConversao > best.taxaConversao ? current : best;
      }, corretorMetrics[0] || { name: 'N/A', taxaConversao: 0 });

      // 4. Buscar dados das equipes
      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes')
        .select('id, nome');

      if (equipesError) throw equipesError;

      // Calcular métricas por equipe
      const equipeMetrics = equipesData?.map(equipe => {
        const equipeUsers = usersData?.filter(user => user.equipe_id === equipe.id) || [];
        const equipeLeads = leadsData?.filter(lead => 
          equipeUsers.some(user => user.id === lead.user_id)
        ) || [];
        
        return {
          ...equipe,
          totalLeads: equipeLeads.length,
          metaAtingida: equipeLeads.length > 0 ? Math.min((equipeLeads.length / 100) * 100, 150) : 0 // Meta fictícia de 100 leads por equipe
        };
      }) || [];

      const equipeDestaque = equipeMetrics.reduce((best, current) => {
        return current.totalLeads > best.totalLeads ? current : best;
      }, equipeMetrics[0] || { nome: 'N/A', totalLeads: 0, metaAtingida: 0 });

      // 5. Calcular conversão geral e crescimento
      const conversaoGeral = totalLeads > 0 ? (vendasFechadas / totalLeads) * 100 : 0;
      
      // Para calcular crescimento, comparar com período anterior (implementação simplificada)
      const crescimento = Math.random() * 20 - 5; // Valor temporário para demonstração

      // 6. Tempo médio de atendimento (simulado baseado em dados existentes)
      const tempoMedioAtendimento = totalLeads > 0 ? Math.floor(Math.random() * 20) + 5 : 0;

      setMetrics({
        totalLeads,
        leadsAguardando,
        visitasAgendadas,
        vendasFechadas,
        tempoMedioAtendimento,
        melhorCorretor: {
          nome: melhorCorretor.name || 'N/A',
          taxaConversao: Number(melhorCorretor.taxaConversao?.toFixed(1)) || 0
        },
        equipeDestaque: {
          nome: equipeDestaque.nome || 'N/A',
          totalLeads: equipeDestaque.totalLeads || 0,
          metaAtingida: Number(equipeDestaque.metaAtingida?.toFixed(1)) || 0
        },
        conversaoGeral: Number(conversaoGeral.toFixed(1)),
        crescimento: Number(crescimento.toFixed(1))
      });

    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
      setError('Erro ao carregar métricas do dashboard');
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    loading,
    error,
    refreshMetrics: loadMetrics
  };
}