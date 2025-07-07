
import { useState } from "react";
import { Lead } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLead: (leadData: Partial<Lead>) => void;
}

export function NewLeadModal({ isOpen, onClose, onCreateLead }: NewLeadModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    dadosAdicionais: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      alert('Nome e Telefone são obrigatórios');
      return;
    }

    const newLead: Partial<Lead> = {
      id: Date.now().toString(),
      nome: formData.nome,
      telefone: formData.telefone,
      dadosAdicionais: formData.dadosAdicionais || undefined,
      dataCriacao: new Date(),
      etapa: 'aguardando-atendimento',
      etiquetas: [],
      corretor: 'Sistema',
      atividades: [],
      status: 'ativo'
    };

    onCreateLead(newLead);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      nome: '',
      telefone: '',
      dadosAdicionais: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Lead
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
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div>
            <Label htmlFor="dadosAdicionais">Dados Adicionais do Lead</Label>
            <textarea
              id="dadosAdicionais"
              value={formData.dadosAdicionais}
              onChange={(e) => setFormData({ ...formData, dadosAdicionais: e.target.value })}
              placeholder="Digite informações adicionais sobre o lead..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
