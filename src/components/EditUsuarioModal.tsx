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
import { Edit, Trash2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EditUsuarioModalProps {
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

export function EditUsuarioModal({ corretor, isOpen, onClose, onUpdateCorretor, equipes = [] }: EditUsuarioModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'corretor' as 'admin' | 'gestor' | 'corretor' | 'dono',
    equipeId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (corretor) {
      setFormData({
        nome: corretor.nome || '',
        email: corretor.email || '',
        telefone: corretor.telefone || '',
        role: corretor.role || 'corretor',
        equipeId: corretor.equipeId || ''
      });
    }
  }, [corretor]);

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
          equipe_id: formData.equipeId === 'no-team' ? null : (formData.equipeId || null)
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
        equipeNome: equipes.find(e => e.id === formData.equipeId)?.nome
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

  const canDeleteUser = user && (user.role === 'admin' || user.role === 'gestor');

  if (!corretor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
              required
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
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

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

          <div className="flex justify-between items-center pt-4 border-t">
            {canDeleteUser && (
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
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

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}