import { useState } from "react";
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
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (teamData: Partial<Equipe>) => void;
  corretores: Corretor[];
}

export function NewTeamModal({ isOpen, onClose, onCreateTeam, corretores }: NewTeamModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    responsavelId: '',
    corretoresSelecionados: [] as string[]
  });
  const [searchResponsavel, setSearchResponsavel] = useState('');
  const [searchCorretores, setSearchCorretores] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome da equipe é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      const responsavel = formData.responsavelId && formData.responsavelId !== 'none' 
        ? corretores.find(c => c.id === formData.responsavelId) 
        : null;

      // Inserir equipe no Supabase
      const { data: equipeData, error: equipeError } = await supabase
        .from('equipes')
        .insert({
          nome: formData.nome,
          responsavel_id: formData.responsavelId === 'none' ? null : formData.responsavelId || null,
          responsavel_nome: responsavel?.nome || null
        })
        .select('*')
        .single();

      if (equipeError) {
        console.error('Erro ao criar equipe:', equipeError);
        toast.error('Erro ao criar equipe');
        return;
      }

      // Atualizar equipe_id dos corretores selecionados
      if (formData.corretoresSelecionados.length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ equipe_id: equipeData.id })
          .in('id', formData.corretoresSelecionados);

        if (updateError) {
          console.error('Erro ao atualizar corretores:', updateError);
          toast.error('Equipe criada, mas erro ao associar corretores');
        }
      }

      const newTeam: Partial<Equipe> = {
        id: equipeData.id,
        nome: equipeData.nome,
        responsavelId: equipeData.responsavel_id,
        responsavelNome: equipeData.responsavel_nome,
        corretores: formData.corretoresSelecionados
      };

      onCreateTeam(newTeam);
      toast.success('Equipe criada com sucesso!');
      handleClose();
    } catch (error) {
      console.error('Erro geral:', error);
      toast.error('Erro ao criar equipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nome: '',
      responsavelId: '',
      corretoresSelecionados: []
    });
    setSearchResponsavel('');
    setSearchCorretores('');
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Criar Nova Equipe
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
            <Label htmlFor="responsavel">Responsável pela Equipe</Label>
            <div className="space-y-2">
              <Input
                placeholder="Buscar responsável..."
                value={searchResponsavel}
                onChange={(e) => setSearchResponsavel(e.target.value)}
                className="w-full"
              />
              <Select value={formData.responsavelId} onValueChange={(value) => setFormData({ ...formData, responsavelId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável (opcional)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Sem responsável</SelectItem>
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

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Equipe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}