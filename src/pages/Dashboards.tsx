import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  Calendar,
  Users,
  LayoutList,
  Download,
  Clock,
  UserCheck,
  CalendarCheck,
  TrendingUp,
  Loader2
} from "lucide-react";

const Dashboards = () => {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();
  const { isAdmin, isGestor } = useUserRole();

  // Calcular o range de data baseado no filtro selecionado
  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  // Buscar métricas reais do banco de dados
  const { metrics, loading, error } = useDashboardMetrics(dateRange);

  // Verificar se o usuário pode ver "Performance do Corretor"
  const canViewCorretorPerformance = isAdmin || isGestor;


  const handleDateFilterChange = (option: DateFilterOption, customRange?: DateRange) => {
    setDateFilter(option);
    if (customRange) {
      setCustomDateRange(customRange);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
        <p className="text-gray-600 mt-1">
          Análises de performance e relatórios detalhados
        </p>
      </div>

      {/* Filtros e Export */}
      <Card>
        <CardHeader>
            <CardTitle>Métricas Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando métricas...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">
              Erro ao carregar dados: {error}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filtro de Data</label>
                  <DateFilter
                    value={dateFilter}
                    customRange={customDateRange}
                    onValueChange={handleDateFilterChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutList className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Total de Leads</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{metrics.totalLeads}</div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">Aguardando</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">{metrics.leadsAguardando}</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarCheck className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Visitas Agendadas</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{metrics.visitasAgendadas}</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Vendas Fechadas</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{metrics.vendasFechadas}</div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Tempo Médio</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">{metrics.tempoMedioAtendimento}min</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cards de Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {canViewCorretorPerformance && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dashboards/performance-corretor')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Performance do Corretor</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Acompanhe o desempenho individual de cada corretor, incluindo leads convertidos, tempo médio de resposta e taxa de conversão.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Corretor Destaque:</span>
                  <span className="font-medium">{loading ? '...' : metrics.melhorCorretor.nome}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa Conversão:</span>
                  <span className="font-medium text-green-600">
                    {loading ? '...' : `${metrics.melhorCorretor.taxaConversao}%`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboards/performance-equipe')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <LayoutList className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Performance da Equipe</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              Visão geral do desempenho da equipe, comparativos entre corretores e metas atingidas.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Equipe Destaque:</span>
                <span className="font-medium">
                  {loading ? '...' : `${metrics.equipeDestaque.nome} - ${metrics.equipeDestaque.totalLeads} leads`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total de Leads:</span>
                <span className="font-medium">
                  {loading ? '...' : `${metrics.equipeDestaque.totalLeads} leads`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboards/performance-geral')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Performance Geral</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              Relatórios gerais da empresa, incluindo análise de campanhas e performance consolidada.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversão Geral:</span>
                <span className="font-medium text-green-600">
                  {loading ? '...' : `${metrics.conversaoGeral}%`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Crescimento:</span>
                <span className={`font-medium ${metrics.crescimento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {loading ? '...' : `${metrics.crescimento >= 0 ? '+' : ''}${metrics.crescimento}%`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboards;