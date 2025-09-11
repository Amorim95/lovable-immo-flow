import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useCorretorPerformance } from "@/hooks/useCorretorPerformance";
import { useLeadStages } from "@/hooks/useLeadStages";
import { Loader2, Trophy, Medal, Award, Target, Clock, TrendingUp } from "lucide-react";
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

const MobilePerformancePorCorretor = () => {
  const { stages } = useLeadStages();
  const [corretorSelecionado, setCorretorSelecionado] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  const { corretores, selectedCorretor, rankingCorretores, loading, error } = useCorretorPerformance(corretorSelecionado, dateRange);

  const corretor = selectedCorretor || {
    id: "",
    nome: "Nenhum corretor selecionado",
    status: "ativo",
    leadsRecebidos: 0,
    vendasFechadas: 0,
    tempoMedioResposta: 0,
    tempoMedioAbertura: 0,
    conversao: 0,
    leadsPorEtapa: {}
  };

  // Criar dados de status dinâmicos e config baseados nas etapas da empresa
  const dadosStatus = stages.map(stage => {
    const { color } = getStageIcon(stage.nome);
    return {
      name: stage.nome,
      value: corretor.leadsPorEtapa[stage.nome] || 0,
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

  // Auto-selecionar primeiro corretor
  useEffect(() => {
    if (corretores.length > 0 && !corretorSelecionado) {
      setCorretorSelecionado(corretores[0].id);
    }
  }, [corretores, corretorSelecionado]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background pb-20">
        <MobileHeader title="Performance por Corretor" />
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
        <MobileHeader title="Performance por Corretor" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-red-600 text-center p-4">
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-orange-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center bg-primary/10 text-primary rounded-full text-xs font-bold">{position + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background pb-20">
      <MobileHeader title="Performance por Corretor" />

      <div className="p-4 space-y-4">
        {/* Ranking Top 3 */}
        {rankingCorretores.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Corretores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankingCorretores.slice(0, 3).map((corretor, index) => (
                <div key={corretor.id} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  {getRankIcon(index)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{corretor.nome}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>Abertura: {corretor.tempoMedioAbertura}h</span>
                      <span>Resposta: {corretor.tempoMedioResposta}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Corretor</label>
              <Select value={corretorSelecionado} onValueChange={setCorretorSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um corretor" />
                </SelectTrigger>
                <SelectContent>
                  {corretores.map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      {corretor.nome} {corretor.status === 'inativo' ? '(Inativo)' : ''}
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

        {/* Métricas do Corretor Selecionado */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Recebidos</p>
                  <p className="text-2xl font-bold text-primary">{corretor.leadsRecebidos}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </div>
                <p className="text-xl font-bold text-green-600">{corretor.vendasFechadas}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-muted-foreground">Conversão</p>
                </div>
                <p className="text-xl font-bold text-orange-600">{corretor.conversao}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground">Resposta</p>
                </div>
                <p className="text-lg font-bold text-purple-600">{corretor.tempoMedioResposta}h</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-muted-foreground">Abertura</p>
                </div>
                <p className="text-lg font-bold text-orange-600">{corretor.tempoMedioAbertura}h</p>
              </CardContent>
            </Card>
          </div>
        </div>

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

        {/* Lista de Status Detalhada */}
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
                      ({corretor.leadsRecebidos > 0 ? ((item.value / corretor.leadsRecebidos) * 100).toFixed(1) : '0.0'}%)
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

export default MobilePerformancePorCorretor;