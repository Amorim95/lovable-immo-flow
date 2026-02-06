import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useCompany } from "@/contexts/CompanyContext";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, ChevronRight, User, Moon } from "lucide-react";
import { NotificationPromptBanner } from "@/components/NotificationPromptBanner";

export default function MobileConfiguracoes() {
  const { user, logout } = useAuth();
  const { isAdmin, isGestor } = useUserRole();
  const { settings, updateSettings } = useCompany();
  const navigate = useNavigate();
  const canManageUsers = isAdmin || isGestor;

  const handleDarkModeToggle = (checked: boolean) => {
    updateSettings({ isDarkMode: checked });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [{
    id: 'users',
    title: 'Gerenciar Plantões',
    description: 'Gerenciar corretores e equipes',
    icon: Users,
    action: () => navigate('/corretores'),
    show: canManageUsers
  }, {
    id: 'profile',
    title: 'Informações Pessoais',
    description: 'Gerencie suas informações de perfil e senha',
    icon: User,
    action: () => navigate('/profile'),
    show: true
  }];

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Opções" />

      {/* Banner de notificações */}
      <NotificationPromptBanner />

      <div className="p-4 space-y-6">
        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.filter(item => item.show).map(item => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id} 
                onClick={item.action} 
                className="bg-card rounded-lg p-4 shadow-sm border active:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Dark Mode Toggle - Above user info */}
        <div className="bg-card rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Moon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Modo Noturno</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ative para reduzir o cansaço visual
                </p>
              </div>
            </div>
            <Switch
              checked={settings.isDarkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </div>

        {/* User Info */}
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <Button onClick={handleLogout} variant="destructive" className="w-full justify-start" size="lg">
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Feito por Rhenan Amorim</p>
        </div>
      </div>
    </div>
  );
}
