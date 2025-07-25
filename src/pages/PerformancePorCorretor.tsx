import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useCorretorPerformance } from "@/hooks/useCorretorPerformance";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";

const chartConfig = {
  aguardando: { label: "Aguardando", color: "#64748b" },
  tentativas: { label: "Tentativas", color: "#eab308" },
  atendeu: { label: "Atendeu", color: "#3b82f6" },
  visita: { label: "Visita", color: "#8b5cf6" },
  vendas: { label: "Vendas", color: "#10b981" },
  pausa: { label: "Pausa", color: "#f97316" }
};

const PerformancePorCorretor = () => {
  const [corretorSelecionado, setCorretorSelecionado] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  // Calcular o range de data baseado no filtro selecionado
  const dateRange = useMemo(() => {
    return getDateRangeFromFilter(dateFilter, customDateRange);
  }, [dateFilter, customDateRange]);

  // Buscar dados reais do banco
  const { corretores, selectedCorretor, loading, error } = useCorretorPerformance(corretorSelecionado, dateRange);

  const corretor = selectedCorretor || {
    id: "",
    nome: "Nenhum corretor selecionado",
    status: "ativo",
    leadsRecebidos: 0,
    vendasFechadas: 0,
    tempoMedioResposta: 0,
    conversao: 0,
    aguardandoAtendimento: 0,
    tentativasContato: 0,
    atendeu: 0,
    visita: 0,
    vendas: 0,
    pausa: 0
  };

  const dadosStatus = [
    { name: "Aguardando", value: corretor.aguardandoAtendimento, color: chartConfig.aguardando.color },
    { name: "Tentativas", value: corretor.tentativasContato, color: chartConfig.tentativas.color },
    { name: "Atendeu", value: corretor.atendeu, color: chartConfig.atendeu.color },
    { name: "Visita", value: corretor.visita, color: chartConfig.visita.color },
    { name: "Vendas", value: corretor.vendas, color: chartConfig.vendas.color },
    { name: "Pausa", value: corretor.pausa, color: chartConfig.pausa.color }
  ];

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

  // Atualizar corretor selecionado quando os dados carregarem
  useState(() => {
    if (corretores.length > 0 && !corretorSelecionado) {
      setCorretorSelecionado(corretores[0].id);
    }
  });

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <div className="text-3xl font-bold text-purple-600">{corretor.tempoMedioResposta} min</div>
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