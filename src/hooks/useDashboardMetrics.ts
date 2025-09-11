import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadStages } from './useLeadStages';

interface DashboardMetrics {
  totalLeads: number;
  leadsPorEtapa: { [key: string]: number };
  tempoMedioAtendimento: number;
  melhorCorretor: {
    nome: string;
    taxaConversao: number;
  };
  equipeDestaque: {
    nome: string;
    totalLeads: number;
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
  const { stages } = useLeadStages();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    leadsPorEtapa: {},
    tempoMedioAtendimento: 0,
    melhorCorretor: {
      nome: 'N/A',
      taxaConversao: 0
    },
    equipeDestaque: {
      nome: 'N/A',
      totalLeads: 0
    },
    conversaoGeral: 0,
    crescimento: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || stages.length === 0) return;
    loadMetrics();
  }, [user, dateRange, stages]);

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
        .select('id, etapa, stage_name, created_at, user_id, primeiro_contato_whatsapp')
        .gte('created_at', dateRange?.from?.toISOString() || '1900-01-01')
        .lte('created_at', dateRange?.to?.toISOString() || '2100-01-01');

      if (leadsError) throw leadsError;

      const totalLeads = leadsData?.length || 0;

      // Calcular leads por etapa baseado nas etapas customizadas
      const leadsPorEtapa: { [key: string]: number } = {};
      stages.forEach(stage => {
        const count = leadsData?.filter(lead => {
          if (lead.stage_name) {
            return lead.stage_name === stage.nome;
          }
          // Fallback para compatibilidade
          return stage.legacy_key && lead.etapa === stage.legacy_key;
        }).length || 0;
        leadsPorEtapa[stage.nome] = count;
      });

      // 2. Buscar dados dos usuários para análise por corretor
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, equipe_id')
        .eq('status', 'ativo');

      if (usersError) throw usersError;

      // 3. Calcular métricas por corretor
      const corretorMetrics = usersData?.map(user => {
        const userLeads = leadsData?.filter(lead => lead.user_id === user.id) || [];
        // Encontrar etapa de vendas/sucesso da empresa
        const vendaStage = stages.find(s => 
          s.nome.toLowerCase().includes('venda') || 
          s.nome.toLowerCase().includes('fechada') ||
          s.legacy_key === 'vendas-fechadas'
        );
        
        const userVendas = userLeads.filter(lead => {
          if (lead.stage_name && vendaStage) {
            return lead.stage_name === vendaStage.nome;
          }
          return lead.etapa === 'vendas-fechadas';
        }).length;
        
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
          totalLeads: equipeLeads.length
        };
      }) || [];

      const equipeDestaque = equipeMetrics.reduce((best, current) => {
        return current.totalLeads > best.totalLeads ? current : best;
      }, equipeMetrics[0] || { nome: 'N/A', totalLeads: 0 });

      // 5. Calcular conversão geral e crescimento real
      const vendaStage = stages.find(s => 
        s.nome.toLowerCase().includes('venda') || 
        s.nome.toLowerCase().includes('fechada') ||
        s.legacy_key === 'vendas-fechadas'
      );
      
      const vendasFechadas = leadsData?.filter(lead => {
        if (lead.stage_name && vendaStage) {
          return lead.stage_name === vendaStage.nome;
        }
        return lead.etapa === 'vendas-fechadas';
      }).length || 0;
      
      const conversaoGeral = totalLeads > 0 ? (vendasFechadas / totalLeads) * 100 : 0;
      
      // Calcular crescimento comparando com período anterior
      const periodoDays = dateRange?.from && dateRange?.to 
        ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 30; // Default 30 dias
      
      const startDatePreviousPeriod = new Date();
      const endDatePreviousPeriod = new Date();
      
      if (dateRange?.from && dateRange?.to) {
        startDatePreviousPeriod.setTime(dateRange.from.getTime() - (periodoDays * 24 * 60 * 60 * 1000));
        endDatePreviousPeriod.setTime(dateRange.to.getTime() - (periodoDays * 24 * 60 * 60 * 1000));
      } else {
        startDatePreviousPeriod.setDate(startDatePreviousPeriod.getDate() - 60);
        endDatePreviousPeriod.setDate(endDatePreviousPeriod.getDate() - 30);
      }
      
      // Buscar leads do período anterior
      const { data: leadsPreviousPeriod } = await supabase
        .from('leads')
        .select('id')
        .gte('created_at', startDatePreviousPeriod.toISOString())
        .lte('created_at', endDatePreviousPeriod.toISOString());
      
      const leadsPeriodoAnterior = leadsPreviousPeriod?.length || 0;
      const crescimento = leadsPeriodoAnterior > 0 
        ? ((totalLeads - leadsPeriodoAnterior) / leadsPeriodoAnterior) * 100 
        : totalLeads > 0 ? 100 : 0;

      // 6. Calcular tempo médio de resposta real (em horas)
      const leadsComTempo = leadsData?.filter(lead => lead.primeiro_contato_whatsapp) || [];
      let tempoMedioAtendimento = 0;
      
      if (leadsComTempo.length > 0) {
        const temposResposta = leadsComTempo.map(lead => {
          const created = new Date(lead.created_at);
          const resposta = new Date(lead.primeiro_contato_whatsapp);
          return (resposta.getTime() - created.getTime()) / (1000 * 60 * 60); // Converter para horas
        });
        
        const somaTempos = temposResposta.reduce((acc, tempo) => acc + tempo, 0);
        tempoMedioAtendimento = Number((somaTempos / temposResposta.length).toFixed(1));
      }

      setMetrics({
        totalLeads,
        leadsPorEtapa,
        tempoMedioAtendimento,
        melhorCorretor: {
          nome: melhorCorretor.name || 'N/A',
          taxaConversao: Number(melhorCorretor.taxaConversao?.toFixed(1)) || 0
        },
        equipeDestaque: {
          nome: equipeDestaque.nome || 'N/A',
          totalLeads: equipeDestaque.totalLeads || 0
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