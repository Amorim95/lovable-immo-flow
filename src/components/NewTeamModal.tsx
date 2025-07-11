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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      alert('Nome da equipe é obrigatório');
      return;
    }

    const responsavel = formData.responsavelId && formData.responsavelId !== 'none' 
      ? corretores.find(c => c.id === formData.responsavelId) 
      : null;
    
    const newTeam: Partial<Equipe> = {
      id: Date.now().toString(),
      nome: formData.nome,
      responsavelId: formData.responsavelId === 'none' ? null : formData.responsavelId || null,
      responsavelNome: responsavel?.nome || null,
      corretores: formData.corretoresSelecionados
    };

    onCreateTeam(newTeam);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      nome: '',
      responsavelId: '',
      corretoresSelecionados: []
    });
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

  const corretoresDisponiveis = corretores.filter(c => c.status === 'ativo');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
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
            <Select value={formData.responsavelId} onValueChange={(value) => setFormData({ ...formData, responsavelId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {corretoresDisponiveis.map((corretor) => (
                  <SelectItem key={corretor.id} value={corretor.id}>
                    {corretor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Corretores da Equipe</Label>
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {corretoresDisponiveis.map((corretor) => (
                <div key={corretor.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={corretor.id}
                    checked={formData.corretoresSelecionados.includes(corretor.id)}
                    onCheckedChange={(checked) =>
                      handleCorretorChange(corretor.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={corretor.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {corretor.nome}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Equipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}