import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

// Dados fictícios gerais da empresa
const dadosGerais = {
  leadsTotais: 1250,
  tempoMedioResposta: 13,
  tempoMedioPrimeiroContato: 18,
  conversaoGeral: 6.8,
  aguardandoAtendimento: 142,
  tentativasContato: 298,
  atendeu: 425,
  visita: 215,
  vendasFechadas: 85,
  pausa: 85
};

const dadosEvolutivos = [
  { mes: "Jan", leads: 95, vendas: 6, tempoResposta: 15 },
  { mes: "Fev", leads: 108, vendas: 8, tempoResposta: 14 },
  { mes: "Mar", leads: 102, vendas: 7, tempoResposta: 12 },
  { mes: "Abr", leads: 125, vendas: 9, tempoResposta: 13 },
  { mes: "Mai", leads: 118, vendas: 8, tempoResposta: 11 },
  { mes: "Jun", leads: 132, vendas: 11, tempoResposta: 10 },
  { mes: "Jul", leads: 128, vendas: 9, tempoResposta: 12 },
  { mes: "Ago", leads: 145, vendas: 12, tempoResposta: 13 },
  { mes: "Set", leads: 139, vendas: 10, tempoResposta: 14 },
  { mes: "Out", leads: 148, vendas: 13, tempoResposta: 12 },
  { mes: "Nov", leads: 155, vendas: 15, tempoResposta: 11 },
  { mes: "Dez", leads: 162, vendas: 17, tempoResposta: 10 }
];

const chartConfig = {
  aguardando: { label: "Aguardando", color: "#64748b" },
  tentativas: { label: "Tentativas", color: "#eab308" },
  atendeu: { label: "Atendeu", color: "#3b82f6" },
  visita: { label: "Visita", color: "#8b5cf6" },
  vendas: { label: "Vendas", color: "#10b981" },
  pausa: { label: "Pausa", color: "#f97316" }
};

const PerformanceGeral = () => {
  const [dataInicio, setDataInicio] = useState("2024-01-01");
  const [dataFim, setDataFim] = useState("2024-12-31");

  const dadosStatus = [
    { name: "Aguardando", value: dadosGerais.aguardandoAtendimento, color: chartConfig.aguardando.color },
    { name: "Tentativas", value: dadosGerais.tentativasContato, color: chartConfig.tentativas.color },
    { name: "Atendeu", value: dadosGerais.atendeu, color: chartConfig.atendeu.color },
    { name: "Visita", value: dadosGerais.visita, color: chartConfig.visita.color },
    { name: "Vendas", value: dadosGerais.vendasFechadas, color: chartConfig.vendas.color },
    { name: "Pausa", value: dadosGerais.pausa, color: chartConfig.pausa.color }
  ];

  const exportarPDF = () => {
    alert("Funcionalidade de export PDF será implementada");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Geral</h1>
          <p className="text-gray-600 mt-1">Visão consolidada de toda a empresa</p>
        </div>
        <Button onClick={exportarPDF} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtro por Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{dadosGerais.leadsTotais}</div>
            <p className="text-sm text-green-600 mt-1">+12.5% vs mês anterior</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo Médio Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{dadosGerais.tempoMedioResposta} min</div>
            <p className="text-sm text-green-600 mt-1">-2 min vs meta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{dadosGerais.conversaoGeral}%</div>
            <p className="text-sm text-green-600 mt-1">+0.8% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo 1º Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{dadosGerais.tempoMedioPrimeiroContato} min</div>
            <p className="text-sm text-yellow-600 mt-1">Meta: 15 min</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Evolução Anual - Leads vs Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={dadosEvolutivos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                  name="Leads"
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stackId="2" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.8} 
                  name="Vendas"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evolução do Tempo de Resposta */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Tempo de Resposta</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={dadosEvolutivos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Line 
                type="monotone" 
                dataKey="tempoResposta" 
                stroke="#f97316" 
                strokeWidth={3}
                name="Tempo Resposta (min)"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Tabelas de Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {((item.value / dadosGerais.leadsTotais) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas vs Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Tempo Resposta</span>
                <div className="text-right">
                  <div className="font-bold">{dadosGerais.tempoMedioResposta} min</div>
                  <div className="text-sm text-gray-500">Meta: 15 min</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Taxa Conversão</span>
                <div className="text-right">
                  <div className="font-bold">{dadosGerais.conversaoGeral}%</div>
                  <div className="text-sm text-gray-500">Meta: 8%</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Leads Mensais</span>
                <div className="text-right">
                  <div className="font-bold">104</div>
                  <div className="text-sm text-gray-500">Meta: 100</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceGeral;