import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";

// Dados fictícios para demonstração
const equipesFicticias = [
  {
    id: "1",
    nome: "Equipe Zona Sul",
    leadsTotais: 530,
    visitas: 90,
    vendas: 32,
    tempoMedioResposta: 10,
    conversao: 6.0,
    aguardandoAtendimento: 45,
    tentativasContato: 128,
    atendeu: 187,
    visita: 90,
    vendasFechadas: 32,
    pausa: 48
  },
  {
    id: "2",
    nome: "Equipe Centro",
    leadsTotais: 420,
    visitas: 75,
    vendas: 28,
    tempoMedioResposta: 15,
    conversao: 6.7,
    aguardandoAtendimento: 32,
    tentativasContato: 98,
    atendeu: 145,
    visita: 75,
    vendasFechadas: 28,
    pausa: 42
  }
];

const chartConfig = {
  aguardando: { label: "Aguardando", color: "#64748b" },
  tentativas: { label: "Tentativas", color: "#eab308" },
  atendeu: { label: "Atendeu", color: "#3b82f6" },
  visita: { label: "Visita", color: "#8b5cf6" },
  vendas: { label: "Vendas", color: "#10b981" },
  pausa: { label: "Pausa", color: "#f97316" }
};

const PerformanceDaEquipe = () => {
  const [equipeSelecionada, setEquipeSelecionada] = useState("1");
  const [dataInicio, setDataInicio] = useState("2024-01-01");
  const [dataFim, setDataFim] = useState("2024-12-31");

  const equipe = equipesFicticias.find(e => e.id === equipeSelecionada) || equipesFicticias[0];

  const dadosStatus = [
    { name: "Aguardando", value: equipe.aguardandoAtendimento, color: chartConfig.aguardando.color },
    { name: "Tentativas", value: equipe.tentativasContato, color: chartConfig.tentativas.color },
    { name: "Atendeu", value: equipe.atendeu, color: chartConfig.atendeu.color },
    { name: "Visita", value: equipe.visita, color: chartConfig.visita.color },
    { name: "Vendas", value: equipe.vendasFechadas, color: chartConfig.vendas.color },
    { name: "Pausa", value: equipe.pausa, color: chartConfig.pausa.color }
  ];

  const dadosComparacao = [
    { metric: "Tempo Resposta", value: equipe.tempoMedioResposta, meta: 15, unit: "min" },
    { metric: "Taxa Conversão", value: equipe.conversao, meta: 8, unit: "%" },
    { metric: "Leads Totais", value: equipe.leadsTotais, meta: 500, unit: "" }
  ];

  const exportarPDF = () => {
    alert("Funcionalidade de export PDF será implementada");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance da Equipe</h1>
          <p className="text-gray-600 mt-1">Análise consolidada da performance da equipe</p>
        </div>
        <Button onClick={exportarPDF} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipe</label>
              <Select value={equipeSelecionada} onValueChange={setEquipeSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  {equipesFicticias.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <CardTitle className="text-lg">Leads Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{equipe.leadsTotais}</div>
            <p className="text-sm text-gray-500 mt-1">Total de leads da equipe</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Visitas Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{equipe.visitas}</div>
            <p className="text-sm text-gray-500 mt-1">{((equipe.visitas / equipe.leadsTotais) * 100).toFixed(1)}% dos leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Vendas Fechadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{equipe.vendas}</div>
            <p className="text-sm text-gray-500 mt-1">{equipe.conversao}% de conversão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo Médio Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{equipe.tempoMedioResposta} min</div>
            <p className="text-sm text-gray-500 mt-1">Média da equipe</p>
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
            <LineChart data={[
              { mes: "Jan", leads: 45, vendas: 3 },
              { mes: "Fev", leads: 52, vendas: 4 },
              { mes: "Mar", leads: 48, vendas: 2 },
              { mes: "Abr", leads: 61, vendas: 5 },
              { mes: "Mai", leads: 55, vendas: 4 },
              { mes: "Jun", leads: 49, vendas: 3 }
            ]}>
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
                  <th className="text-right py-3 px-4 font-medium">Variação</th>
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
                      {((item.value / equipe.leadsTotais) * 100).toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4 text-green-600">
                      +{(Math.random() * 10).toFixed(1)}%
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