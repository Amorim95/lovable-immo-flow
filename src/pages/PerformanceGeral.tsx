import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { usePerformanceGeral } from "@/hooks/usePerformanceGeral";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePerformanceGeral from "./MobilePerformanceGeral";

const chartConfig = {
  aguardando: { label: "Aguardando", color: "#64748b" },
  tentativas: { label: "Tentativas", color: "#eab308" },
  atendeu: { label: "Atendeu", color: "#3b82f6" },
  nomeSujo: { label: "Nome Sujo", color: "#f59e0b" },
  nomeLimpo: { label: "Nome Limpo", color: "#14b8a6" },
  visita: { label: "Visita", color: "#8b5cf6" },
  vendas: { label: "Vendas", color: "#10b981" },
  pausa: { label: "Pausa", color: "#f97316" },
  descarte: { label: "Descarte", color: "#ef4444" }
};

const PerformanceGeral = () => {
  const isMobile = useIsMobile();
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

  const dadosStatus = [
    { name: "Aguardando", value: performanceGeral.aguardandoAtendimento, color: chartConfig.aguardando.color },
    { name: "Tentativas", value: performanceGeral.tentativasContato, color: chartConfig.tentativas.color },
    { name: "Atendeu", value: performanceGeral.atendeu, color: chartConfig.atendeu.color },
    { name: "Nome Sujo", value: performanceGeral.nomeSujo, color: chartConfig.nomeSujo.color },
    { name: "Nome Limpo", value: performanceGeral.nomeLimpo, color: chartConfig.nomeLimpo.color },
    { name: "Visita", value: performanceGeral.visita, color: chartConfig.visita.color },
    { name: "Vendas", value: performanceGeral.vendasFechadas, color: chartConfig.vendas.color },
    { name: "Pausa", value: performanceGeral.pausa, color: chartConfig.pausa.color },
    { name: "Descarte", value: performanceGeral.descarte, color: chartConfig.descarte.color }
  ];


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
            <h1 className="text-3xl font-bold text-gray-900">Performance Geral</h1>
            <p className="text-gray-600 mt-1">Visão consolidada de toda a empresa</p>
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
            <p className="text-sm text-green-600 mt-1">
              {performanceGeral.crescimentoMensal >= 0 ? '+' : ''}{performanceGeral.crescimentoMensal}% vs mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo Médio Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{performanceGeral.tempoMedioResposta} min</div>
            <p className="text-sm text-green-600 mt-1">-2 min vs meta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{performanceGeral.conversaoGeral}%</div>
            <p className="text-sm text-green-600 mt-1">+0.8% vs mês anterior</p>
          </CardContent>
        </Card>

      </div>

      {/* Gráfico Principal */}
      <div className="grid grid-cols-1 gap-6">
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
                  <tr key={index} className="border-b hover:bg-gray-50">
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