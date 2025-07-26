import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  LogOut, 
  Users, 
  ChevronRight,
  User
} from "lucide-react";

export default function MobileConfiguracoes() {
  const { user, logout } = useAuth();
  const { isAdmin, isGestor } = useUserRole();
  const navigate = useNavigate();

  const canManageUsers = isAdmin || isGestor;
  const canAccessCompanyData = isAdmin || isGestor;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Informações Pessoais',
      description: 'Gerencie suas informações de perfil e senha',
      icon: User,
      action: () => navigate('/profile'),
      show: true
    },
    {
      id: 'company',
      title: 'Dados da Empresa',
      description: 'Informações e configurações da empresa',
      icon: Building2,
      action: () => navigate('/company-settings'),
      show: canAccessCompanyData
    },
    {
      id: 'users',
      title: 'Gestão de Usuários',
      description: 'Gerenciar corretores e equipes',
      icon: Users,
      action: () => navigate('/corretores'),
      show: canManageUsers
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Configurações" />

      <div className="p-4 space-y-6">
        {/* User Info */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            
            return (
              <div
                key={item.id}
                onClick={item.action}
                className="bg-white rounded-lg p-4 shadow-sm border active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
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

        {/* Logout Button */}
        <div className="pt-4">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start"
            size="lg"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>CRM Imobiliário v1.0</p>
        </div>
      </div>
    </div>
  );
}