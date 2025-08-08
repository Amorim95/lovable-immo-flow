
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCompany } from "@/contexts/CompanyContext";
import { AccessControlWrapper } from "@/components/AccessControlWrapper";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  LayoutList, 
  Calendar,
  Users,
  Settings,
  Building2,
  Globe
} from "lucide-react";

const menuItems = [
  { 
    title: "Leads", 
    url: "/", 
    icon: LayoutList,
    description: "Gestão de leads",
    showForAll: true
  },
  { 
    title: "Dashboards", 
    url: "/dashboards", 
    icon: Calendar,
    description: "Análises e relatórios",
    showForAll: true
  },
  { 
    title: "Imóveis", 
    url: "/imoveis", 
    icon: Building2,
    description: "Gestão de imóveis",
    showForAll: true,
    badge: "Em desenvolvimento"
  },
  { 
    title: "Corretores", 
    url: "/corretores", 
    icon: Users,
    description: "Gestão de usuários",
    requireAdminOrGestor: true
  },
  { 
    title: "Configurações", 
    url: "/configuracoes", 
    icon: Settings,
    description: "Configurações do sistema",
    showForAll: true // Permitir acesso para todos, controle interno na página
  },
  { 
    title: "Meu Site", 
    url: "/meu-site", 
    icon: Globe,
    description: "Site público",
    showForAll: true
  }
];

export function CRMSidebar() {
  const { state } = useSidebar();
  const { settings } = useCompany();
  const { isAdmin, isGestor, isCorretor, loading } = useUserRole();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClassName = (path: string) => {
    const baseClass = "flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200 min-h-[60px]";
    if (isActive(path)) {
      return `${baseClass} bg-primary text-primary-foreground font-medium shadow-sm`;
    }
    return `${baseClass} text-muted-foreground hover:bg-accent hover:text-accent-foreground`;
  };

  // Filtrar itens do menu baseado nas permissões
  const filteredMenuItems = menuItems.filter(item => {
    if (loading) return true; // Mostrar todos durante carregamento
    
    if (item.showForAll) return true;
    if (item.requireAdminOrGestor && !isAdmin && !isGestor) return false;
    
    return true;
  });

  return (
    <Sidebar className={`${collapsed ? "w-20" : "w-72"} border-r bg-card`} collapsible="icon">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0">
            <img 
              src={settings.logo || "/lovable-uploads/3ebecda3-d067-45fc-8317-a3481a6aed5a.png"} 
              alt={`${settings.name} Logo`} 
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-foreground">{settings.name}</h1>
              <p className="text-xs text-muted-foreground">Feito Por: Monumental Marketing</p>
              <div className="mt-2">
                <UserRoleBadge showIcon={false} variant="outline" />
              </div>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg">
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                      title={collapsed ? item.title : ""}
                    >
                      <item.icon className={`${collapsed ? "w-6 h-6" : "w-5 h-5"} flex-shrink-0`} />
                      {!collapsed && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-medium leading-tight">{item.title}</span>
                            {item.badge && (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-md">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-sm opacity-70 leading-tight">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="p-4 border-t">
        <SidebarTrigger className="w-full" />
      </div>
    </Sidebar>
  );
}
