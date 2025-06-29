
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
import { 
  LayoutList, 
  Calendar,
  Users,
  Phone,
  Edit,
  User
} from "lucide-react";

const menuItems = [
  { 
    title: "Leads", 
    url: "/", 
    icon: LayoutList,
    description: "Gestão de leads"
  },
  { 
    title: "Dashboards", 
    url: "/dashboards", 
    icon: Calendar,
    description: "Análises e relatórios"
  },
  { 
    title: "Corretores", 
    url: "/corretores", 
    icon: Users,
    description: "Gestão de equipe"
  },
  { 
    title: "Imóveis", 
    url: "/imoveis", 
    icon: Edit,
    description: "Cadastro de imóveis"
  },
  { 
    title: "Filas", 
    url: "/filas", 
    icon: Phone,
    description: "Filas de atendimento"
  },
  { 
    title: "Configurações", 
    url: "/configuracoes", 
    icon: User,
    description: "Configurações do sistema"
  }
];

export function CRMSidebar() {
  const { state } = useSidebar();
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

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-72"} border-r bg-card`} collapsible="icon">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Edit className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-foreground">CRM Imobiliário</h1>
              <p className="text-xs text-muted-foreground">Sistema de gestão</p>
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
              {menuItems.map((item) => (
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
                          <span className="text-base font-medium leading-tight">{item.title}</span>
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
