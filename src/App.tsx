
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CRMSidebar } from "@/components/CRMSidebar";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboards from "./pages/Dashboards";
import PerformancePorCorretor from "./pages/PerformancePorCorretor";
import PerformanceDaEquipe from "./pages/PerformanceDaEquipe";
import PerformanceGeral from "./pages/PerformanceGeral";
import Corretores from "./pages/Corretores";
import Imoveis from "./pages/Imoveis";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Login />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  const { settings } = useCompany();
  const { user, logout } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gray-50">
              <CRMSidebar />
              <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
                  <SidebarTrigger className="lg:hidden" />
                  <div className="flex-1" />
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      {user?.name} - {settings.name}
                    </div>
                    <button
                      onClick={logout}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Sair
                    </button>
                  </div>
                </header>
                <main className="flex-1 p-6">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboards" element={<Dashboards />} />
                    <Route path="/dashboards/performance-corretor" element={<PerformancePorCorretor />} />
                    <Route path="/dashboards/performance-equipe" element={<PerformanceDaEquipe />} />
                    <Route path="/dashboards/performance-geral" element={<PerformanceGeral />} />
                    <Route path="/corretores" element={<Corretores />} />
                    <Route path="/imoveis" element={<Imoveis />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CompanyProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </CompanyProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
