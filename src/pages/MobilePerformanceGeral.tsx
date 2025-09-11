import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { usePerformanceGeral } from "@/hooks/usePerformanceGeral";
import { useLeadStages } from "@/hooks/useLeadStages";
import { Loader2, ArrowLeft, TrendingUp, Target, Clock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { MobileHeader } from "@/components/MobileHeader";

// Function to get stage icon and color
const getStageIcon = (stageName: string) => {
  const lowerName = stageName.toLowerCase();
  if (lowerName.includes('aguardando')) return { color: '#64748b' };
  if (lowerName.includes('tentativa')) return { color: '#eab308' };
  if (lowerName.includes('atendeu')) return { color: '#3b82f6' };
  if (lowerName.includes('sujo')) return { color: '#f59e0b' };
  if (lowerName.includes('limpo')) return { color: '#14b8a6' };
  if (lowerName.includes('visita')) return { color: '#8b5cf6' };
  if (lowerName.includes('venda') || lowerName.includes('fechada')) return { color: '#10b981' };
  if (lowerName.includes('pausa')) return { color: '#f97316' };
  if (lowerName.includes('descarte')) return { color: '#ef4444' };
  return { color: '#6b7280' };
};

const MobilePerformanceGeral = () => {
  const { stages } = useLeadStages();
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  const { performanceGeral, loading, error } = usePerformanceGeral(dateRange);

  // Criar dados de status dinâmicos e config baseados nas etapas da empresa
  const dadosStatus = stages.map(stage => {
    const { color } = getStageIcon(stage.nome);
    return {
      name: stage.nome,
      value: performanceGeral.leadsPorEtapa[stage.nome] || 0,
      color
    };
  });

  // Criar config dinâmico para os gráficos
  const chartConfig = stages.reduce((config, stage) => {
    const { color } = getStageIcon(stage.nome);
    config[stage.nome.toLowerCase().replace(/\s+/g, '')] = {
      label: stage.nome,
      color
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  const handleDateFilterChange = (option: DateFilterOption, customRange?: DateRange) => {
    setDateFilter(option);
    if (customRange) {
      setCustomDateRange(customRange);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background pb-20">
        <MobileHeader title="Performance Geral" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <span className="text-sm text-muted-foreground">Carregando dados...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background dark:bg-background pb-20">
        <MobileHeader title="Performance Geral" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-red-600 text-center p-4">
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background pb-20">
      <MobileHeader title="Performance Geral" />

      <div className="p-4 space-y-4">
        {/* Filtro de Data */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtro por Data</CardTitle>
          </CardHeader>
          <CardContent>
            <DateFilter
              value={dateFilter}
              customRange={customDateRange}
              onValueChange={handleDateFilterChange}
            />
          </CardContent>
        </Card>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold text-primary">{performanceGeral.leadsTotais}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-muted-foreground">Tempo Resposta</p>
                </div>
                <p className="text-xl font-bold text-orange-600">{performanceGeral.tempoMedioResposta} min</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Conversão</p>
                </div>
                <p className="text-xl font-bold text-green-600">{performanceGeral.conversaoGeral}%</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gráfico de Pizza Compacto */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <PieChart>
                <Pie
                  data={dadosStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                >
                  {dadosStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Lista de Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Detalhamento</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {dadosStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-2 hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{item.value}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({performanceGeral.leadsTotais > 0 ? ((item.value / performanceGeral.leadsTotais) * 100).toFixed(1) : '0.0'}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobilePerformanceGeral;