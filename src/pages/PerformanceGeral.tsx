import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { usePerformanceGeral } from "@/hooks/usePerformanceGeral";
import { useLeadStages } from "@/hooks/useLeadStages";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTagColor } from "@/lib/utils";
import MobilePerformanceGeral from "./MobilePerformanceGeral";

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

const PerformanceGeral = () => {
  const isMobile = useIsMobile();
  const { stages } = useLeadStages();
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  // Calcular o range de data baseado no filtro selecionado
  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  // Buscar dados reais do banco - sempre chamar todos os hooks
  const { performanceGeral, evolutionData, loading, error } = usePerformanceGeral(dateRange);

  // Usar versão mobile em dispositivos móveis APÓS todos os hooks
  if (isMobile) {
    return <MobilePerformanceGeral />;
  }

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span>Carregando dados de performance geral...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold">Erro ao carregar dados</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Performance Geral</h1>
            <p className="text-muted-foreground mt-1">Visão consolidada de toda a empresa</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtro por Data</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{performanceGeral.leadsTotais}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo Médio Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{performanceGeral.tempoMedioResposta} min</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{performanceGeral.conversaoGeral}%</div>
          </CardContent>
        </Card>

      </div>

      {/* Seção de Métricas de Etiquetas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card com Total por Etiqueta */}
        <Card>
          <CardHeader>
            <CardTitle>Total por Etiqueta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(performanceGeral.totalPorEtiqueta).map(([etiqueta, total]) => (
                <div key={etiqueta} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">{etiqueta}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{total}</span>
                    <span className="text-sm text-muted-foreground">
                      ({performanceGeral.leadsTotais > 0 ? ((total / performanceGeral.leadsTotais) * 100).toFixed(1) : '0.0'}%)
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(performanceGeral.totalPorEtiqueta).length === 0 && (
                <div className="text-muted-foreground text-center py-4">
                  Nenhuma etiqueta encontrada no período selecionado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card com Gráfico de Etiquetas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Etiquetas</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(performanceGeral.totalPorEtiqueta).length > 0 ? (
              <ChartContainer config={{}} className="h-[250px]">
                <PieChart>
                  <Pie
                    data={Object.entries(performanceGeral.totalPorEtiqueta).map(([nome, valor]) => ({
                      name: nome,
                      value: valor,
                      color: nome === 'Lead Qualificado Pela IA' 
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                        : '#000000'
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {Object.entries(performanceGeral.totalPorEtiqueta).map(([nome], index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getTagColor(nome)} 
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                Nenhum dado de etiqueta para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada de Etiquetas por Etapa */}
      <Card>
        <CardHeader>
          <CardTitle>Etiquetas por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Etapa</th>
                  {Object.keys(performanceGeral.totalPorEtiqueta).map(etiqueta => (
                    <th key={etiqueta} className="text-center py-3 px-4 font-medium">{etiqueta}</th>
                  ))}
                  <th className="text-right py-3 px-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {stages.map(stage => {
                  const etapaData = performanceGeral.etiquetasPorEtapa[stage.nome] || {};
                  const totalEtapa = performanceGeral.leadsPorEtapa[stage.nome] || 0;
                  
                  return (
                    <tr key={stage.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{stage.nome}</td>
                      {Object.keys(performanceGeral.totalPorEtiqueta).map(etiqueta => (
                        <td key={etiqueta} className="text-center py-3 px-4">
                          {etapaData[etiqueta] || 0}
                        </td>
                      ))}
                      <td className="text-right py-3 px-4 font-medium">{totalEtapa}</td>
                    </tr>
                  );
                })}
                {stages.length === 0 && (
                  <tr>
                    <td colSpan={Object.keys(performanceGeral.totalPorEtiqueta).length + 2} 
                        className="text-center py-4 text-muted-foreground">
                      Nenhuma etapa configurada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Principal */}
      <div className="grid grid-cols-1 gap-6">{/* ... keep existing code ... */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Geral por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={dadosStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
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

      </div>

      {/* Tabela de Análise */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Qtd</th>
                  <th className="text-right py-3 px-4 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {dadosStatus.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      {item.name}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">{item.value}</td>
                    <td className="text-right py-3 px-4">
                      {performanceGeral.leadsTotais > 0 ? ((item.value / performanceGeral.leadsTotais) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceGeral;