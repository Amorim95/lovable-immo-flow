import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useEquipePerformance } from "@/hooks/useEquipePerformance";
import { useLeadStages } from "@/hooks/useLeadStages";
import { Download, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { getTagColor } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePerformanceDaEquipe from "./MobilePerformanceDaEquipe";

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

const PerformanceDaEquipe = () => {
  const isMobile = useIsMobile();
  const { stages } = useLeadStages();
  const [equipeSelecionada, setEquipeSelecionada] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  // Calcular o range de data baseado no filtro selecionado
  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  // Buscar dados reais do banco - sempre chamar todos os hooks
  const { equipes, selectedEquipe, rankingEquipes, loading, error } = useEquipePerformance(equipeSelecionada, dateRange);

  // Usar versão mobile em dispositivos móveis APÓS todos os hooks
  if (isMobile) {
    return <MobilePerformanceDaEquipe />;
  }

  const equipe = selectedEquipe || {
    id: "",
    nome: "Nenhuma equipe selecionada",
    leadsTotais: 0,
    visitas: 0,
    vendas: 0,
    tempoMedioResposta: 0,
    conversao: 0,
    leadsPorEtapa: {},
    etiquetasPorEtapa: {},
    totalPorEtiqueta: {}
  };

  // Criar dados de status dinâmicos e config baseados nas etapas da empresa
  const dadosStatus = stages.map(stage => {
    const { color } = getStageIcon(stage.nome);
    return {
      name: stage.nome,
      value: equipe.leadsPorEtapa[stage.nome] || 0,
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

  const dadosComparacao = [
    { metric: "Tempo Resposta", value: equipe.tempoMedioResposta, meta: 15, unit: "min" },
    { metric: "Taxa Conversão", value: equipe.conversao, meta: 8, unit: "%" },
    { metric: "Leads Totais", value: equipe.leadsTotais, meta: 100, unit: "" }
  ];


  const handleDateFilterChange = (option: DateFilterOption, customRange?: DateRange) => {
    setDateFilter(option);
    if (customRange) {
      setCustomDateRange(customRange);
    }
  };

  // Dados evolutivos simulados
  const dadosEvolutivos = [
    { mes: "Jan", leads: Math.floor(equipe.leadsTotais * 0.08), vendas: Math.floor(equipe.vendas * 0.08) },
    { mes: "Fev", leads: Math.floor(equipe.leadsTotais * 0.09), vendas: Math.floor(equipe.vendas * 0.09) },
    { mes: "Mar", leads: Math.floor(equipe.leadsTotais * 0.07), vendas: Math.floor(equipe.vendas * 0.07) },
    { mes: "Abr", leads: Math.floor(equipe.leadsTotais * 0.10), vendas: Math.floor(equipe.vendas * 0.10) },
    { mes: "Mai", leads: Math.floor(equipe.leadsTotais * 0.09), vendas: Math.floor(equipe.vendas * 0.09) },
    { mes: "Jun", leads: Math.floor(equipe.leadsTotais * 0.08), vendas: Math.floor(equipe.vendas * 0.08) }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span>Carregando dados de performance das equipes...</span>
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
            <h1 className="text-3xl font-bold text-foreground">Performance da Equipe</h1>
            <p className="text-muted-foreground mt-1">Análise consolidada da performance da equipe</p>
          </div>
        </div>
      </div>


      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipe</label>
              <Select value={equipeSelecionada} onValueChange={setEquipeSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Leads Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{equipe.leadsTotais}</div>
            <p className="text-sm text-muted-foreground mt-1">Total de leads da equipe</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Visitas Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{equipe.visitas}</div>
            <p className="text-sm text-muted-foreground mt-1">{equipe.leadsTotais > 0 ? ((equipe.visitas / equipe.leadsTotais) * 100).toFixed(1) : '0.0'}% dos leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Vendas Fechadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{equipe.vendas}</div>
            <p className="text-sm text-muted-foreground mt-1">{equipe.conversao}% de conversão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo Médio Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{equipe.tempoMedioResposta} min</div>
            <p className="text-sm text-muted-foreground mt-1">Média da equipe</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Leads por Status</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Performance vs Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={dadosComparacao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Bar dataKey="value" fill="#3b82f6" name="Atual" />
                <Bar dataKey="meta" fill="#e5e7eb" name="Meta" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução dos Leads por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={dadosEvolutivos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" />
              <Line type="monotone" dataKey="vendas" stroke="#10b981" name="Vendas" />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Seção de Métricas de Etiquetas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card com Total por Etiqueta */}
        <Card>
          <CardHeader>
            <CardTitle>Total de Etiquetas da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(equipe.totalPorEtiqueta || {}).map(([etiqueta, total]) => (
                <div key={etiqueta} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">{etiqueta}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{total}</span>
                    <span className="text-sm text-muted-foreground">
                      ({equipe.leadsTotais > 0 ? ((total / equipe.leadsTotais) * 100).toFixed(1) : '0.0'}%)
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(equipe.totalPorEtiqueta || {}).length === 0 && (
                <div className="text-muted-foreground text-center py-4">
                  Nenhuma etiqueta encontrada para esta equipe no período selecionado
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
            {Object.keys(equipe.totalPorEtiqueta || {}).length > 0 ? (
              <ChartContainer config={{}} className="h-[250px]">
                <PieChart>
                  <Pie
                    data={Object.entries(equipe.totalPorEtiqueta || {}).map(([nome, valor]) => ({
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
                    {Object.entries(equipe.totalPorEtiqueta || {}).map(([nome], index) => (
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
      {Object.keys(equipe.totalPorEtiqueta || {}).length > 0 && (
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
                    {Object.keys(equipe.totalPorEtiqueta || {}).map(etiqueta => (
                      <th key={etiqueta} className="text-center py-3 px-4 font-medium">{etiqueta}</th>
                    ))}
                    <th className="text-right py-3 px-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map(stage => {
                    const etapaData = equipe.etiquetasPorEtapa?.[stage.nome] || {};
                    const totalEtapa = equipe.leadsPorEtapa[stage.nome] || 0;
                    
                    return (
                      <tr key={stage.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{stage.nome}</td>
                        {Object.keys(equipe.totalPorEtiqueta || {}).map(etiqueta => (
                          <td key={etiqueta} className="text-center py-3 px-4">
                            {etapaData[etiqueta] || 0}
                          </td>
                        ))}
                        <td className="text-right py-3 px-4 font-medium">{totalEtapa}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Quantidade</th>
                  <th className="text-right py-3 px-4 font-medium">Percentual</th>
                  
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
                      {equipe.leadsTotais > 0 ? ((item.value / equipe.leadsTotais) * 100).toFixed(1) : '0.0'}%
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

export default PerformanceDaEquipe;