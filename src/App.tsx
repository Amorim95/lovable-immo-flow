
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CRMSidebar } from "@/components/CRMSidebar";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import Index from "./pages/Index";
import Dashboards from "./pages/Dashboards";
import Corretores from "./pages/Corretores";
import Imoveis from "./pages/Imoveis";
import Filas from "./pages/Filas";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { settings } = useCompany();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <CRMSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {settings.name}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboards" element={<Dashboards />} />
              <Route path="/corretores" element={<Corretores />} />
              <Route path="/imoveis" element={<Imoveis />} />
              <Route path="/filas" element={<Filas />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CompanyProvider>
          <AppContent />
        </CompanyProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
