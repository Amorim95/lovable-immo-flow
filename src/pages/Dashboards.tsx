
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Users,
  LayoutList,
  Download,
  Clock,
  UserCheck,
  CalendarCheck,
  TrendingUp
} from "lucide-react";

// Dados fictícios para métricas gerais
const metricas = {
  totalLeads: 1250,
  leadsAguardando: 142,
  visitasAgendadas: 215,
  vendasFechadas: 85,
  tempoMedioAtendimento: 13.5
};

const Dashboards = () => {
  const navigate = useNavigate();
  const [dataInicio, setDataInicio] = useState("2024-01-01");
  const [dataFim, setDataFim] = useState("2024-12-31");

  const exportarPDF = () => {
    alert("Funcionalidade de export PDF será implementada");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
        <p className="text-gray-600 mt-1">
          Análises de performance e relatórios detalhados
        </p>
      </div>

      {/* Filtros e Export */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Métricas Gerais</CardTitle>
            <Button onClick={exportarPDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <LayoutList className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total de Leads</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{metricas.totalLeads}</div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-600">Aguardando</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{metricas.leadsAguardando}</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Visitas Agendadas</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{metricas.visitasAgendadas}</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Vendas Fechadas</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{metricas.vendasFechadas}</div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Tempo Médio</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{metricas.tempoMedioAtendimento}min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboards/performance-corretor')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Performance do Corretor</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              Acompanhe o desempenho individual de cada corretor, incluindo leads convertidos, tempo médio de resposta e taxa de conversão.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Corretor Destaque:</span>
                <span className="font-medium">João Silva</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa Conversão:</span>
                <span className="font-medium text-green-600">14.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboards/performance-equipe')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <LayoutList className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Performance da Equipe</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              Visão geral do desempenho da equipe, comparativos entre corretores e metas atingidas.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Equipe Zona Sul:</span>
                <span className="font-medium">530 leads</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Meta do Mês:</span>
                <span className="font-medium text-blue-600">106% atingida</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboards/performance-geral')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Performance Geral</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              Relatórios gerais da empresa, incluindo análise de campanhas e performance consolidada.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversão Geral:</span>
                <span className="font-medium text-green-600">6.8%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Crescimento:</span>
                <span className="font-medium text-green-600">+12.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboards;
