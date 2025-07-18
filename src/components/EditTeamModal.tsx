import { useState, useEffect } from "react";
import { Equipe, Corretor } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditTeamModalProps {
  equipe: Equipe | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTeam: (equipeId: string, updates: Partial<Equipe>) => void;
  onDeleteTeam: (equipeId: string) => void;
  corretores: Corretor[];
}

export function EditTeamModal({ 
  equipe, 
  isOpen, 
  onClose, 
  onUpdateTeam, 
  onDeleteTeam,
  corretores 
}: EditTeamModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    responsavelId: '',
    corretoresSelecionados: [] as string[]
  });
  const [searchResponsavel, setSearchResponsavel] = useState('');
  const [searchCorretores, setSearchCorretores] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (equipe) {
      setFormData({
        nome: equipe.nome || '',
        responsavelId: equipe.responsavelId || '',
        corretoresSelecionados: equipe.corretores || []
      });
    }
  }, [equipe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipe || !formData.nome.trim() || !formData.responsavelId) {
      toast.error('Nome da equipe e responsável são obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      const responsavel = corretores.find(c => c.id === formData.responsavelId);
      
      // Atualizar equipe na tabela equipes
      const { error } = await supabase
        .from('equipes')
        .update({
          nome: formData.nome,
          responsavel_id: formData.responsavelId,
          responsavel_nome: responsavel?.nome || ''
        })
        .eq('id', equipe.id);

      if (error) {
        console.error('Error updating team:', error);
        toast.error('Erro ao atualizar equipe');
        return;
      }

      // Atualizar usuários para remover da equipe anterior
      await supabase
        .from('users')
        .update({ equipe_id: null })
        .eq('equipe_id', equipe.id);

      // Atualizar usuários selecionados para esta equipe
      if (formData.corretoresSelecionados.length > 0) {
        await supabase
          .from('users')
          .update({ equipe_id: equipe.id })
          .in('id', formData.corretoresSelecionados);
      }
      
      onUpdateTeam(equipe.id, {
        nome: formData.nome,
        responsavelId: formData.responsavelId,
        responsavelNome: responsavel?.nome || '',
        corretores: formData.corretoresSelecionados
      });
      
      toast.success('Equipe atualizada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Erro ao atualizar equipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (equipe) {
      onDeleteTeam(equipe.id);
      setShowDeleteDialog(false);
      onClose();
    }
  };

  const handleCorretorChange = (corretorId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        corretoresSelecionados: [...prev.corretoresSelecionados, corretorId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        corretoresSelecionados: prev.corretoresSelecionados.filter(id => id !== corretorId)
      }));
    }
  };

  const corretoresDisponiveis = corretores.filter(corretor => 
    corretor.status === 'ativo'
  );

  const responsaveisFiltrados = corretoresDisponiveis.filter(corretor =>
    corretor.nome.toLowerCase().includes(searchResponsavel.toLowerCase()) ||
    corretor.email.toLowerCase().includes(searchResponsavel.toLowerCase())
  );

  const corretoresFiltrados = corretoresDisponiveis.filter(corretor =>
    corretor.nome.toLowerCase().includes(searchCorretores.toLowerCase()) ||
    corretor.email.toLowerCase().includes(searchCorretores.toLowerCase())
  );

  if (!equipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Equipe
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Equipe *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Equipe Zona Sul"
              required
            />
          </div>

          <div>
            <Label htmlFor="responsavel">Responsável pela Equipe *</Label>
            <div className="space-y-2">
              <Input
                placeholder="Buscar responsável..."
                value={searchResponsavel}
                onChange={(e) => setSearchResponsavel(e.target.value)}
                className="w-full"
              />
              <Select value={formData.responsavelId} onValueChange={(value) => setFormData({ ...formData, responsavelId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {responsaveisFiltrados.map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{corretor.nome}</span>
                        <span className="text-sm text-muted-foreground">{corretor.email}</span>
                        <span className="text-xs text-muted-foreground capitalize">{corretor.role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Corretores da Equipe</Label>
            <div className="space-y-3 mt-2">
              <Input
                placeholder="Buscar corretores..."
                value={searchCorretores}
                onChange={(e) => setSearchCorretores(e.target.value)}
                className="w-full"
              />
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                {corretoresFiltrados.length > 0 ? (
                  <div className="space-y-2">
                    {corretoresFiltrados.map((corretor) => (
                      <div key={corretor.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded-md transition-colors">
                        <Checkbox
                          id={corretor.id}
                          checked={formData.corretoresSelecionados.includes(corretor.id)}
                          onCheckedChange={(checked) =>
                            handleCorretorChange(corretor.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={corretor.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{corretor.nome}</span>
                            <span className="text-xs text-gray-500">{corretor.email}</span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500">
                    <p className="text-xs">Nenhum corretor encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Equipe
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a equipe "{equipe.nome}"? 
                    Esta ação não pode ser desfeita e os corretores da equipe ficarão sem equipe.
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}