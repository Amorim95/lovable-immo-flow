import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { NotificationPromptBanner } from "@/components/NotificationPromptBanner";

export default function MobileProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    telefone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveInfo = async () => {
    // Implementar salvamento de informações pessoais
    toast({
      title: "Informações atualizadas",
      description: "Suas informações pessoais foram atualizadas com sucesso."
    });
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    // Implementar mudança de senha
    toast({
      title: "Senha alterada",
      description: "Sua senha foi alterada com sucesso."
    });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (activeTab === 'password') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 dark:bg-background">
        <MobileHeader 
          title="Alterar Senha" 
          showBackButton
          onBack={() => setActiveTab('info')}
        />

        <div className="p-4">
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div>
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Digite sua senha atual"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Digite sua nova senha"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirme sua nova senha"
              />
            </div>

            <Button 
              onClick={handleChangePassword}
              className="w-full"
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              Alterar Senha
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 dark:bg-background">
      <MobileHeader title="Informações Pessoais" />

      {/* Banner de notificações */}
      <NotificationPromptBanner />

      <div className="p-4 space-y-4">
        {/* Opção de Alterar Senha */}
        <div className="space-y-3">
          <div
            onClick={() => setActiveTab('password')}
            className="bg-white rounded-lg p-4 shadow-sm border active:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Alterar Senha</h3>
                  <p className="text-sm text-gray-500">Alterar sua senha de acesso</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
        </div>

        {/* Formulário de Informações Pessoais */}
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Seus Dados</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                placeholder="(11) 99999-9999"
              />
            </div>

            {isEditing && (
              <Button 
                onClick={handleSaveInfo}
                className="w-full"
              >
                Salvar Alterações
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}