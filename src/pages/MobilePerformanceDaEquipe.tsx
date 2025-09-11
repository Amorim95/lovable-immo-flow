import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useEquipePerformance } from "@/hooks/useEquipePerformance";
import { useLeadStages } from "@/hooks/useLeadStages";
import { Loader2, Users, Target, Clock, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
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

const MobilePerformanceDaEquipe = () => {
  const { stages } = useLeadStages();
  const [equipeSelecionada, setEquipeSelecionada] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  const { equipes, selectedEquipe, loading, error } = useEquipePerformance(equipeSelecionada, dateRange);

  const equipe = selectedEquipe || {
    id: "",
    nome: "Nenhuma equipe selecionada",
    leadsTotais: 0,
    visitas: 0,
    vendas: 0,
    tempoMedioResposta: 0,
    conversao: 0,
    leadsPorEtapa: {}
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

  const handleDateFilterChange = (option: DateFilterOption, customRange?: DateRange) => {
    setDateFilter(option);
    if (customRange) {
      setCustomDateRange(customRange);
    }
  };

  // Dados evolutivos simplificados para mobile
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
      <div className="min-h-screen bg-background dark:bg-background pb-20">
        <MobileHeader title="Performance da Equipe" />
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
        <MobileHeader title="Performance da Equipe" />
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
      <MobileHeader title="Performance da Equipe" />

      <div className="p-4 space-y-4">
        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Equipe</label>
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
            <div>
              <label className="text-sm font-medium mb-1 block">Data</label>
              <DateFilter
                value={dateFilter}
                customRange={customDateRange}
                onValueChange={handleDateFilterChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Métricas da Equipe */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Totais</p>
                  <p className="text-2xl font-bold text-primary">{equipe.leadsTotais}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground">Visitas</p>
                </div>
                <p className="text-xl font-bold text-purple-600">{equipe.visitas}</p>
                <p className="text-xs text-muted-foreground">
                  {equipe.leadsTotais > 0 ? ((equipe.visitas / equipe.leadsTotais) * 100).toFixed(1) : '0.0'}% dos leads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </div>
                <p className="text-xl font-bold text-green-600">{equipe.vendas}</p>
                <p className="text-xs text-muted-foreground">{equipe.conversao}% conversão</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio Resposta</p>
                  <p className="text-2xl font-bold text-orange-600">{equipe.tempoMedioResposta} min</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Evolução */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[180px]">
              <LineChart data={dadosEvolutivos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" strokeWidth={2} />
                <Line type="monotone" dataKey="vendas" stroke="#10b981" name="Vendas" strokeWidth={2} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[180px]">
              <PieChart>
                <Pie
                  data={dadosStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
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
                      ({equipe.leadsTotais > 0 ? ((item.value / equipe.leadsTotais) * 100).toFixed(1) : '0.0'}%)
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

export default MobilePerformanceDaEquipe;