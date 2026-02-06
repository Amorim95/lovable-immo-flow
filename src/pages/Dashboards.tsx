import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useLeadStages } from "@/hooks/useLeadStages";
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
  const { isAdmin, isGestor, isCorretor } = useUserRole();
  const { stages } = useLeadStages();

  // Calcular o range de data baseado no filtro selecionado
  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  // Buscar métricas reais do banco de dados
  const { metrics, loading, error } = useDashboardMetrics(dateRange);

  // Verificar se o usuário pode ver "Performance do Corretor"
  const canViewCorretorPerformance = isAdmin || isGestor;

  // Função para obter ícone e cor com base no nome da etapa
  const getStageIcon = (stageName: string) => {
    const lowerName = stageName.toLowerCase();
    if (lowerName.includes('aguardando')) return { icon: Clock, color: 'yellow' };
    if (lowerName.includes('visita')) return { icon: CalendarCheck, color: 'purple' };
    if (lowerName.includes('venda') || lowerName.includes('fechada')) return { icon: TrendingUp, color: 'green' };
    if (lowerName.includes('contato') || lowerName.includes('tentativa')) return { icon: UserCheck, color: 'blue' };
    return { icon: LayoutList, color: 'gray' };
  };


  const handleDateFilterChange = (option: DateFilterOption, customRange?: DateRange) => {
    setDateFilter(option);
    if (customRange) {
      setCustomDateRange(customRange);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboards</h1>
        <p className="text-muted-foreground mt-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Etapas dinâmicas baseadas na configuração da empresa */}
                {stages.slice(0, 3).map(stage => {
                  const { icon: Icon, color } = getStageIcon(stage.nome);
                  const colorClasses = {
                    yellow: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', bold: 'text-yellow-900 dark:text-yellow-300' },
                    purple: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', bold: 'text-purple-900 dark:text-purple-300' },
                    green: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', bold: 'text-green-900 dark:text-green-300' },
                    blue: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', bold: 'text-blue-900 dark:text-blue-300' },
                    gray: { bg: 'bg-muted', text: 'text-muted-foreground', bold: 'text-foreground' }
                  }[color] || { bg: 'bg-muted', text: 'text-muted-foreground', bold: 'text-foreground' };

                  return (
                    <div key={stage.id} className={`${colorClasses.bg} p-4 rounded-lg`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 ${colorClasses.text}`} />
                        <span className={`text-sm font-medium ${colorClasses.text} truncate`}>{stage.nome}</span>
                      </div>
                      <div className={`text-2xl font-bold ${colorClasses.bold}`}>
                        {metrics.leadsPorEtapa[stage.nome] || 0}
                      </div>
                    </div>
                  );
                })}
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
                <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Performance do Corretor</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
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

        {!isCorretor && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dashboards/performance-equipe')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/10 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                  <LayoutList className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Performance da Equipe</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
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
        )}

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboards/performance-geral')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Performance Geral</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
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