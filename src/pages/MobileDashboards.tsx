import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  ChevronRight
} from "lucide-react";

const dashboardItems = [
  {
    id: 'performance-geral',
    title: 'Performance Geral',
    description: 'Visão geral do desempenho',
    icon: BarChart3,
    path: '/dashboards/performance-geral',
    color: 'bg-blue-500'
  },
  {
    id: 'performance-corretor',
    title: 'Performance por Corretor',
    description: 'Análise individual de corretores',
    icon: Target,
    path: '/dashboards/performance-corretor',
    color: 'bg-green-500'
  },
  {
    id: 'performance-equipe',
    title: 'Performance da Equipe',
    description: 'Análise por equipes',
    icon: Users,
    path: '/dashboards/performance-equipe',
    color: 'bg-purple-500'
  }
];

export default function MobileDashboards() {
  const navigate = useNavigate();

  const handleDashboardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Dashboards" />

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Leads Hoje</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">12</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Conversões</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">3</p>
          </div>
        </div>

        {/* Dashboard Menu */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 px-1">Relatórios</h2>
          
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <div
                key={item.id}
                onClick={() => handleDashboardClick(item.path)}
                className="bg-white rounded-lg p-4 shadow-sm border active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Dica</span>
          </div>
          <p className="text-sm text-blue-800">
            Use os relatórios para acompanhar o desempenho da sua equipe e identificar oportunidades de melhoria.
          </p>
        </div>
      </div>
    </div>
  );
}