import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, Mail, Phone, Lock, Save } from 'lucide-react';

// Função para validar força da senha
function validateStrongPassword(password: string): boolean {
  // Senha deve ter pelo menos 8 caracteres
  if (password.length < 8) return false;
  
  // Deve conter pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) return false;
  
  // Deve conter pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) return false;
  
  // Deve conter pelo menos um número
  if (!/[0-9]/.test(password)) return false;
  
  // Deve conter pelo menos um caractere especial
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  
  return true;
}

export function SecuritySettings() {
  const { user, updateProfile, changePassword } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingProfile(true);

    const result = await updateProfile({
      name: profileData.name,
      email: profileData.email
    });

    if (result.success) {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso."
      });
    } else {
      toast({
        title: "Erro ao atualizar",
        description: result.error || "Erro ao atualizar perfil",
        variant: "destructive"
      });
    }

    setIsUpdatingProfile(false);
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos de senha são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e confirmação devem ser iguais.",
        variant: "destructive"
      });
      return;
    }

    // Validar força da senha
    if (!validateStrongPassword(passwordData.newPassword)) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPassword(true);

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);

    if (result.success) {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso."
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      toast({
        title: "Erro ao alterar senha",
        description: result.error || "Erro ao alterar senha",
        variant: "destructive"
      });
    }

    setIsUpdatingPassword(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Acessos e Segurança
        </h2>
        <p className="text-gray-600 mt-1">
          Gerencie suas informações pessoais e configurações de segurança
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {isUpdatingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </Card>

        {/* Alteração de Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Digite sua senha atual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Digite a nova senha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirme a nova senha"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Requisitos da senha:</strong><br />
                • Pelo menos 8 caracteres<br />
                • Uma letra maiúscula e uma minúscula<br />
                • Um número e um caractere especial (!@#$%^&*)
              </p>
            </div>

            <Button 
              onClick={handleChangePassword}
              disabled={isUpdatingPassword}
              className="w-full"
            >
              <Lock className="w-4 h-4 mr-2" />
              {isUpdatingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Tipo de Conta:</span>
              <p className="text-gray-900 capitalize">{user?.role === 'admin' ? 'Administrador' : 'Corretor'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <p className="text-gray-900 capitalize">{user?.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}