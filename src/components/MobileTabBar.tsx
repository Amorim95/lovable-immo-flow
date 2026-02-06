import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, BarChart3, Settings } from "lucide-react";
import { useScrollDirection } from "@/hooks/useScrollDirection";

const tabs = [
  {
    id: "leads",
    label: "Leads",
    path: "/",
    icon: LayoutGrid
  },
  {
    id: "configuracoes",
    label: "Opções", 
    path: "/configuracoes",
    icon: Settings
  }
];

export function MobileTabBar() {
  const location = useLocation();
  const scrollDirection = useScrollDirection();
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-2 z-50 transition-all duration-300 ease-in-out ${
      scrollDirection === 'down' ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
    } shadow-lg`}>
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className="flex flex-col items-center py-2 px-3 min-w-0"
            >
              <Icon 
                className={`w-6 h-6 mb-1 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`} 
              />
              <span 
                className={`text-xs font-medium truncate ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}