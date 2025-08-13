import { useState, useEffect } from "react";
import { Corretor, Equipe } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Edit, Trash2, User, Phone, Mail, Users, Settings, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface MobileEditUsuarioModalProps {
  corretor: Corretor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCorretor: (corretorId: string, updates: Partial<Corretor>) => void;
  equipes?: Equipe[];
}

const availableRoles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'corretor', label: 'Corretor' },
  { value: 'dono', label: 'Dono' }
];

export function MobileEditUsuarioModal({ corretor, isOpen, onClose, onUpdateCorretor, equipes = [] }: MobileEditUsuarioModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'corretor' as 'admin' | 'gestor' | 'corretor' | 'dono',
    equipeId: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'pendente'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { user } = useAuth();
  const { isAdmin, isGestor } = useUserRole();

  const canManageUsers = isAdmin || isGestor;
  const canDeleteUser = isAdmin;
  const canChangeStatus = isAdmin;
  const canChangeRole = isAdmin;

  useEffect(() => {
    if (corretor) {
      setFormData({
        nome: corretor.nome || '',
        email: corretor.email || '',
        telefone: corretor.telefone || '',
        role: corretor.role || 'corretor',
        equipeId: corretor.equipeId || '',
        status: corretor.status || 'ativo'
      });
    }
  }, [corretor]);

  useEffect(() => {
    if (!isOpen) {
      setFocusedField(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!corretor || !formData.nome.trim() || !formData.email.trim()) {
      toast.error('Nome e Email são obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      // Atualizar dados na tabela users
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          role: formData.role,
          equipe_id: formData.equipeId === 'no-team' ? null : (formData.equipeId || null),
          status: formData.status
        })
        .eq('id', corretor.id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Erro ao atualizar usuário');
        return;
      }

      onUpdateCorretor(corretor.id, {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        role: formData.role,
        equipeId: formData.equipeId === 'no-team' ? undefined : formData.equipeId,
        equipeNome: equipes.find(e => e.id === formData.equipeId)?.nome,
        status: formData.status
      });
      
      toast.success('Usuário atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!corretor) return;

    setIsLoading(true);
    
    try {
      // Chamar a Edge Function para deletar o usuário
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: corretor.id }
      });

      if (error) {
        console.error('Error calling delete-user function:', error);
        toast.error('Erro ao deletar usuário: ' + error.message);
        return;
      }

      toast.success('Usuário excluído com sucesso!');
      setShowDeleteDialog(false);
      onClose();
      // Fechar modal após sucesso (a lista será atualizada automaticamente)
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = () => {
    const newStatus = formData.status === 'ativo' ? 'inativo' : 'ativo';
    setFormData({ ...formData, status: newStatus });
  };

  if (!corretor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4" />
              Informações Pessoais
            </div>
            
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
                required
                onClick={() => {
                  setFocusedField('nome');
                  document.getElementById('nome')?.focus();
                }}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
                onClick={() => {
                  setFocusedField('email');
                  document.getElementById('email')?.focus();
                }}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                onClick={() => {
                  setFocusedField('telefone');
                  document.getElementById('telefone')?.focus();
                }}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          <Separator />

          {/* Configurações do Sistema */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Settings className="w-4 h-4" />
              Configurações do Sistema
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Status do Usuário</Label>
                <p className="text-sm text-gray-500">
                  {formData.status === 'ativo' ? 'Usuário pode acessar o sistema' : 'Usuário não pode acessar o sistema'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={formData.status === 'ativo' ? 'default' : 'secondary'}>
                  {formData.status}
                </Badge>
                {canChangeStatus && (
                  <Switch
                    checked={formData.status === 'ativo'}
                    onCheckedChange={toggleStatus}
                  />
                )}
              </div>
            </div>

            {/* Cargo */}
            {canChangeRole && (
              <div>
                <Label htmlFor="role">Cargo</Label>
                <Select value={formData.role} onValueChange={(value: 'admin' | 'gestor' | 'corretor' | 'dono') => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!canChangeRole && (
              <div>
                <Label>Cargo Atual</Label>
                <div className="mt-1">
                  <UserRoleBadge role={formData.role} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Equipe */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="w-4 h-4" />
              Equipe
            </div>

            <div>
              <Label htmlFor="equipe">Equipe</Label>
              <Select value={formData.equipeId} onValueChange={(value) => setFormData({ ...formData, equipeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-team">Sem equipe</SelectItem>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Ações */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="w-4 h-4" />
              Ações Administrativas
            </div>

            <div className="flex flex-col gap-3">
              {/* Botão Excluir */}
              {canDeleteUser && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Usuário
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o usuário "{corretor?.nome}"? 
                        Esta ação não pode ser desfeita e removerá o usuário permanentemente do sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Botões de Salvar/Cancelar */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}