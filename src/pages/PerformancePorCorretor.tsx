import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useCorretorPerformance } from "@/hooks/useCorretorPerformance";
import { useLeadStages } from "@/hooks/useLeadStages";
import { CalendarIcon, Download, Loader2, Trophy, Medal, Award } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { getTagColor } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePerformancePorCorretor from "./MobilePerformancePorCorretor";

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

const PerformancePorCorretor = () => {
  const isMobile = useIsMobile();
  const { stages } = useLeadStages();
  const [corretorSelecionado, setCorretorSelecionado] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  // Calcular o range de data baseado no filtro selecionado
  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  // Buscar dados reais do banco - sempre chamar todos os hooks
  const { corretores, selectedCorretor, rankingCorretores, loading, error } = useCorretorPerformance(corretorSelecionado, dateRange);

  // Auto-selecionar primeiro corretor quando os dados carregarem
  useEffect(() => {
    if (corretores.length > 0 && !corretorSelecionado) {
      setCorretorSelecionado(corretores[0].id);
    }
  }, [corretores, corretorSelecionado]);

  // Usar versão mobile em dispositivos móveis APÓS todos os hooks
  if (isMobile) {
    return <MobilePerformancePorCorretor />;
  }

  const corretor = selectedCorretor || {
    id: "",
    nome: "Nenhum corretor selecionado",
    status: "ativo",
    leadsRecebidos: 0,
    vendasFechadas: 0,
    tempoMedioResposta: 0,
    tempoMedioAbertura: 0,
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

  const dadosBarras = [
    { metric: "Tempo Resposta", value: corretor.tempoMedioResposta, unit: "min" },
    { metric: "Taxa Conversão", value: corretor.conversao, unit: "%" },
    { metric: "Leads Recebidos", value: corretor.leadsRecebidos, unit: "" }
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
        <span>Carregando dados de performance...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Performance por Corretor</h1>
            <p className="text-gray-600 mt-1">Análise detalhada de performance individual</p>
          </div>
        </div>
      </div>
      
      {/* Ranking dos 5 Melhores Corretores */}
      {rankingCorretores.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Ranking dos Corretores Focados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {rankingCorretores.map((corretor, index) => {
                const getRankIcon = (position: number) => {
                  switch (position) {
                    case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
                    case 1: return <Medal className="w-6 h-6 text-gray-400" />;
                    case 2: return <Award className="w-6 h-6 text-orange-600" />;
                    default: return <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-bold">{position + 1}</span>;
                  }
                };

                const getBorderColor = (position: number) => {
                  switch (position) {
                    case 0: return "border-yellow-300 bg-yellow-50";
                    case 1: return "border-gray-300 bg-gray-50";
                    case 2: return "border-orange-300 bg-orange-50";
                    default: return "border-blue-200 bg-blue-50";
                  }
                };

                return (
                  <div 
                    key={corretor.id} 
                    className={`p-4 rounded-lg border-2 ${getBorderColor(index)} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {getRankIcon(index)}
                      <span className="font-bold text-gray-700">{index + 1}º Lugar</span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2 truncate" title={corretor.nome}>
                      {corretor.nome}
                    </h4>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tempo Abertura:</span>
                        <span className="font-medium text-green-600">{corretor.tempoMedioAbertura}h</span>
                      </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Tempo Médio Resposta:</span>
                         <span className="font-medium text-purple-600">{corretor.tempoMedioResposta}h</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Corretor</label>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Leads Recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{corretor.leadsRecebidos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Vendas Fechadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{corretor.vendasFechadas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo Médio Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{corretor.tempoMedioResposta}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo de Abertura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{corretor.tempoMedioAbertura}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{corretor.conversao}%</div>
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
            <CardTitle>Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={dadosBarras}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Bar dataKey="value" fill="#3b82f6" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Métricas de Etiquetas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card com Total por Etiqueta */}
        <Card>
          <CardHeader>
            <CardTitle>Total de Etiquetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(corretor.totalPorEtiqueta || {}).map(([etiqueta, total]) => (
                <div key={etiqueta} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{etiqueta}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{total}</span>
                    <span className="text-sm text-gray-500">
                      ({corretor.leadsRecebidos > 0 ? ((total / corretor.leadsRecebidos) * 100).toFixed(1) : '0.0'}%)
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(corretor.totalPorEtiqueta || {}).length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  Nenhuma etiqueta encontrada para este corretor no período selecionado
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
            {Object.keys(corretor.totalPorEtiqueta || {}).length > 0 ? (
              <ChartContainer config={{}} className="h-[250px]">
                <PieChart>
                  <Pie
                    data={Object.entries(corretor.totalPorEtiqueta || {}).map(([nome, valor]) => ({
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
                    {Object.entries(corretor.totalPorEtiqueta || {}).map(([nome], index) => (
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
              <div className="text-gray-500 text-center py-8">
                Nenhum dado de etiqueta para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada de Etiquetas por Etapa */}
      {Object.keys(corretor.totalPorEtiqueta || {}).length > 0 && (
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
                    {Object.keys(corretor.totalPorEtiqueta || {}).map(etiqueta => (
                      <th key={etiqueta} className="text-center py-3 px-4 font-medium">{etiqueta}</th>
                    ))}
                    <th className="text-right py-3 px-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map(stage => {
                    const etapaData = corretor.etiquetasPorEtapa?.[stage.nome] || {};
                    const totalEtapa = corretor.leadsPorEtapa[stage.nome] || 0;
                    
                    return (
                      <tr key={stage.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{stage.nome}</td>
                        {Object.keys(corretor.totalPorEtiqueta || {}).map(etiqueta => (
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

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Status</CardTitle>
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
                      {corretor.leadsRecebidos > 0 ? ((item.value / corretor.leadsRecebidos) * 100).toFixed(1) : '0.0'}%
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

export default PerformancePorCorretor;