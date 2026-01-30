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

      // Buscar company_id do usuário
      const { data: companyId } = await supabase.rpc('get_user_company_id');

      // 1. Total de Leads - Com paginação para buscar TODOS
      let allLeads: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let leadsQuery = supabase
          .from('leads')
          .select('id, etapa, stage_name, created_at, user_id, primeiro_contato_whatsapp')
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        // Aplicar filtro de empresa apenas se não for super-admin
        if (companyId) {
          leadsQuery = leadsQuery.eq('company_id', companyId);
        }

        // Aplicar filtro de data apenas se houver dateRange
        if (dateRange?.from && dateRange?.to) {
          leadsQuery = leadsQuery
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString());
        }

        const { data, error } = await leadsQuery;

        if (error) throw error;
        if (!data || data.length === 0) break;

        allLeads = [...allLeads, ...data];

        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      }

      const leadsData = allLeads;
      console.log(`Dashboard: Total de leads carregados: ${leadsData.length}`);

      const totalLeads = leadsData?.length || 0;

      // Calcular leads por etapa usando mesma lógica do Kanban
      const leadsPorEtapa: { [key: string]: number } = {};
      stages.forEach(stage => {
        const count = leadsData?.filter(lead => {
          // Prioridade 1: Correspondência EXATA com nome customizado
          if (lead.stage_name === stage.nome) {
            return true;
          }
          
          // Prioridade 2: Correspondência com legacy_key (apenas se não bateu no nome)
          if (stage.legacy_key && lead.stage_name === stage.legacy_key) {
            // Garantir que esse lead não pertence a OUTRA etapa
            const belongsToOtherStage = stages.some(s => 
              s.id !== stage.id && (
                s.nome === lead.stage_name ||
                s.legacy_key === lead.stage_name
              )
            );
            if (!belongsToOtherStage) {
              return true;
            }
          }
          
          // Prioridade 3: Fallback para etapa (apenas se stage_name vazio ou null)
          if ((!lead.stage_name || lead.stage_name === '') && 
              stage.legacy_key && 
              lead.etapa === stage.legacy_key) {
            return true;
          }
          
          return false;
        }).length || 0;
        leadsPorEtapa[stage.nome] = count;
      });

      // 2. Buscar dados dos usuários para análise por corretor
      let usersQuery = supabase
        .from('users')
        .select('id, name, equipe_id')
        .eq('status', 'ativo');

      // Aplicar filtro de empresa apenas se não for super-admin
      if (companyId) {
        usersQuery = usersQuery.eq('company_id', companyId);
      }

      const { data: usersData, error: usersError } = await usersQuery;

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
      // Para período total: comparar últimos 30 dias vs 30 dias anteriores
      // Para período específico: comparar período selecionado vs período anterior equivalente
      let crescimento = 0;
      
      if (dateRange?.from && dateRange?.to) {
        // Período específico selecionado
        const periodoDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        
        const startDatePreviousPeriod = new Date(dateRange.from.getTime() - (periodoDays * 24 * 60 * 60 * 1000));
        const endDatePreviousPeriod = new Date(dateRange.to.getTime() - (periodoDays * 24 * 60 * 60 * 1000));
        
        // Buscar leads do período anterior com paginação
        let previousPeriodLeads: any[] = [];
        let prevFrom = 0;
        let prevHasMore = true;

        while (prevHasMore) {
          let previousPeriodQuery = supabase
            .from('leads')
            .select('id')
            .gte('created_at', startDatePreviousPeriod.toISOString())
            .lte('created_at', endDatePreviousPeriod.toISOString())
            .range(prevFrom, prevFrom + pageSize - 1);

          if (companyId) {
            previousPeriodQuery = previousPeriodQuery.eq('company_id', companyId);
          }

          const { data } = await previousPeriodQuery;
          if (!data || data.length === 0) break;

          previousPeriodLeads = [...previousPeriodLeads, ...data];

          if (data.length < pageSize) {
            prevHasMore = false;
          } else {
            prevFrom += pageSize;
          }
        }

        const leadsPeriodoAnterior = previousPeriodLeads.length;
        
        crescimento = leadsPeriodoAnterior > 0 
          ? ((totalLeads - leadsPeriodoAnterior) / leadsPeriodoAnterior) * 100 
          : totalLeads > 0 ? 100 : 0;
      } else {
        // Período total: comparar últimos 30 dias vs 30 dias anteriores
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
        
        // Leads dos últimos 30 dias com paginação
        let recentLeads: any[] = [];
        let recentFrom = 0;
        let recentHasMore = true;

        while (recentHasMore) {
          let recentQuery = supabase
            .from('leads')
            .select('id')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .range(recentFrom, recentFrom + pageSize - 1);
          
          if (companyId) {
            recentQuery = recentQuery.eq('company_id', companyId);
          }
          
          const { data } = await recentQuery;
          if (!data || data.length === 0) break;

          recentLeads = [...recentLeads, ...data];

          if (data.length < pageSize) {
            recentHasMore = false;
          } else {
            recentFrom += pageSize;
          }
        }

        const leadsRecentes = recentLeads.length;
        
        // Leads de 30-60 dias atrás com paginação
        let previousLeads: any[] = [];
        let prevFrom = 0;
        let prevHasMore = true;

        while (prevHasMore) {
          let previousQuery = supabase
            .from('leads')
            .select('id')
            .gte('created_at', sixtyDaysAgo.toISOString())
            .lt('created_at', thirtyDaysAgo.toISOString())
            .range(prevFrom, prevFrom + pageSize - 1);
          
          if (companyId) {
            previousQuery = previousQuery.eq('company_id', companyId);
          }
          
          const { data } = await previousQuery;
          if (!data || data.length === 0) break;

          previousLeads = [...previousLeads, ...data];

          if (data.length < pageSize) {
            prevHasMore = false;
          } else {
            prevFrom += pageSize;
          }
        }

        const leadsPeriodoAnterior = previousLeads.length;
        
        crescimento = leadsPeriodoAnterior > 0 
          ? ((leadsRecentes - leadsPeriodoAnterior) / leadsPeriodoAnterior) * 100 
          : leadsRecentes > 0 ? 100 : 0;
      }

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