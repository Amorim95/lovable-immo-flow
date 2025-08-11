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
        .select('id, etapa, created_at, user_id, primeiro_contato_whatsapp')
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

      // 4. Buscar dados das equipes e suas metas
      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes')
        .select('id, nome');

      if (equipesError) throw equipesError;

      // Buscar metas do mês atual
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data: metasData, error: metasError } = await supabase
        .from('metas')
        .select('*')
        .eq('mes', currentMonth)
        .eq('ano', currentYear);

      if (metasError) throw metasError;

      // Calcular métricas por equipe
      const equipeMetrics = equipesData?.map(equipe => {
        const equipeUsers = usersData?.filter(user => user.equipe_id === equipe.id) || [];
        const equipeLeads = leadsData?.filter(lead => 
          equipeUsers.some(user => user.id === lead.user_id)
        ) || [];
        
        // Buscar meta da equipe
        const metaEquipe = metasData?.find(meta => 
          meta.tipo === 'equipe' && meta.referencia_id === equipe.id
        );
        
        const metaLeads = metaEquipe?.meta_leads || 50; // Fallback para 50 se não encontrar meta
        const metaAtingida = equipeLeads.length > 0 ? 
          Math.min((equipeLeads.length / metaLeads) * 100, 200) : 0;
        
        return {
          ...equipe,
          totalLeads: equipeLeads.length,
          metaAtingida: Number(metaAtingida.toFixed(1))
        };
      }) || [];

      const equipeDestaque = equipeMetrics.reduce((best, current) => {
        return current.totalLeads > best.totalLeads ? current : best;
      }, equipeMetrics[0] || { nome: 'N/A', totalLeads: 0, metaAtingida: 0 });

      // 5. Calcular conversão geral e crescimento real
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