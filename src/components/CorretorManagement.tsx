import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Send } from 'lucide-react';

interface InviteCorretorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteCorretorModal({ isOpen, onClose }: InviteCorretorModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
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

    if (user?.role !== 'admin') {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem convidar corretores.",
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

      // Gerar token único para o convite
      const inviteToken = crypto.randomUUID();
      
      // Criar o usuário com senha padrão
      const defaultPasswordHash = await supabase
        .rpc('crypt_password', { password: 'Mudar123' });

      if (!defaultPasswordHash.data) {
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
          password_hash: defaultPasswordHash.data,
          role: 'corretor',
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

      // Criar permissões padrão para o corretor
      const { error: permissionsError } = await supabase
        .from('permissions')
        .insert({
          user_id: newUser.id,
          can_invite_users: false,
          can_view_all_leads: false
        });

      if (permissionsError) {
        console.error('Erro ao criar permissões:', permissionsError);
      }

      // Criar convite
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: formData.email.toLowerCase(),
          token: inviteToken,
          status: 'pendente'
        });

      if (inviteError) {
        console.error('Erro ao criar convite:', inviteError);
      }

      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${formData.email}. Senha padrão: Mudar123`,
      });

      // Limpar formulário e fechar modal
      setFormData({ name: '', email: '' });
      onClose();

    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setFormData({ name: '', email: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convidar Novo Corretor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do corretor"
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

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              O corretor receberá um convite por email com a senha padrão: <strong>Mudar123</strong>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CorretorManagement() {
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600 text-center">
            Apenas administradores podem gerenciar corretores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Gerenciar Corretores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Como administrador, você pode convidar novos corretores para o sistema.
          </p>
          
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar Novo Corretor
          </Button>
        </CardContent>
      </Card>

      <InviteCorretorModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </>
  );
}