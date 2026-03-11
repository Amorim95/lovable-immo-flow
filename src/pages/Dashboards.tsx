import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { 
  Calendar,
  Users,
} from "lucide-react";

const Dashboards = () => {
  const navigate = useNavigate();
  const { metrics, loading } = useDashboardMetrics(null);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboards</h1>
        <p className="text-muted-foreground mt-1">
          Análises de performance e relatórios detalhados
        </p>
      </div>


      {/* Cards de Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboards/perfil-cliente')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg">Perfil de Cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Análise do perfil dos leads: renda, estado civil, bairro de preferência e mais.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboards/performance-geral')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Performance Geral</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Relatórios gerais da empresa, incluindo análise de campanhas e performance consolidada.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversão Geral:</span>
                <span className="font-medium text-green-600">
                  {loading ? '...' : `${metrics.conversaoGeral}%`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Crescimento:</span>
                <span className={`font-medium ${metrics.crescimento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {loading ? '...' : `${metrics.crescimento >= 0 ? '+' : ''}${metrics.crescimento}%`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboards;