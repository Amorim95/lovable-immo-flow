
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  calendar as Calendar,
  users as Users,
  layout_list as LayoutList
} from "lucide-react";

const Dashboards = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
        <p className="text-gray-600 mt-1">
          Análises de performance e relatórios detalhados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
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
                <span>Leads Ativos:</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa Conversão:</span>
                <span className="font-medium text-green-600">18.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
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
                <span>Total da Equipe:</span>
                <span className="font-medium">156 leads</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Meta do Mês:</span>
                <span className="font-medium text-blue-600">82% atingida</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
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
              Relatórios gerais da empresa, incluindo receita, leads por fonte e análise de campanhas.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Receita Mensal:</span>
                <span className="font-medium text-green-600">R$ 125.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Crescimento:</span>
                <span className="font-medium text-green-600">+12.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Aguardando Atendimento</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/3 h-2 bg-slate-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">12</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Em Tentativas de Contato</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-2/3 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">24</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Atendeu</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">18</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Visita</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/4 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">8</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vendas Fechadas</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/5 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">6</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fontes de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Facebook Ads</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-full h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Google Ads</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-3/4 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">32%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Instagram</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">15%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Indicação</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/4 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">8%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboards;
