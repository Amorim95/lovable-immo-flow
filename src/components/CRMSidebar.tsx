
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
  layout_list as LayoutList, 
  calendar as Calendar,
  users as Users,
  phone as Phone,
  edit as Edit,
  user as User
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
  const { collapsed } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClassName = (path: string) => {
    const baseClass = "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200";
    if (isActive(path)) {
      return `${baseClass} bg-primary text-primary-foreground font-medium shadow-sm`;
    }
    return `${baseClass} text-muted-foreground hover:bg-accent hover:text-accent-foreground`;
  };

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r bg-card`} collapsible>
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
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                      title={collapsed ? item.title : ""}
                    >
                      <item.icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0`} />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
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
