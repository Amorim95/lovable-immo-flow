
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { AccessControlWrapper } from '@/components/AccessControlWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Send } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'corretor' as 'admin' | 'gestor' | 'corretor'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!isAdmin) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem convidar usuários.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (existingUser) {
        toast({
          title: "Email já existe",
          description: "Este email já está cadastrado no sistema.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Gerar hash de senha padrão
      const { data: passwordHash } = await supabase
        .rpc('crypt_password', { password: 'Mudar123' });

      if (!passwordHash) {
        toast({
          title: "Erro interno",
          description: "Erro ao processar senha padrão.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Inserir novo usuário
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          name: formData.name,
          email: formData.email.toLowerCase(),
          password_hash: passwordHash,
          role: formData.role,
          status: 'pendente'
        })
        .select()
        .single();

      if (userError || !newUser) {
        toast({
          title: "Erro ao criar usuário",
          description: userError?.message || "Erro interno",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Criar permissões padrão
      const defaultPermissions = {
        can_invite_users: formData.role === 'admin',
        can_view_all_leads: formData.role === 'admin' || formData.role === 'gestor',
        can_manage_leads: true,
        can_view_reports: true,
        can_manage_properties: formData.role === 'admin',
        can_manage_teams: formData.role === 'admin',
        can_access_configurations: formData.role === 'admin'
      };

      const { error: permissionsError } = await supabase
        .from('permissions')
        .insert({
          user_id: newUser.id,
          ...defaultPermissions
        });

      if (permissionsError) {
        console.error('Erro ao criar permissões:', permissionsError);
      }

      toast({
        title: "Usuário criado",
        description: `Usuário ${formData.name} criado com sucesso. Senha padrão: Mudar123`,
      });

      // Limpar formulário e fechar modal
      setFormData({ name: '', email: '', role: 'corretor' });
      onClose();

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', role: 'corretor' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Criar Novo Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do usuário"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={formData.role} onValueChange={(value: 'admin' | 'gestor' | 'corretor') => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corretor">Corretor</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              O usuário será criado com a senha padrão: <strong>Mudar123</strong>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CorretorManagement() {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <AccessControlWrapper requireAdmin>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Gerenciar Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Como administrador, você pode criar novos usuários no sistema.
          </p>
          
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Criar Novo Usuário
          </Button>
        </CardContent>
      </Card>

      <InviteUserModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </AccessControlWrapper>
  );
}
