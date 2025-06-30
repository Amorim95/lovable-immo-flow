
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
    telefoneExtra: '',
    rendaFamiliar: '',
    temFGTS: '',
    possuiEntrada: ''
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
      telefoneExtra: formData.telefoneExtra || undefined,
      rendaFamiliar: formData.rendaFamiliar ? Number(formData.rendaFamiliar) : 0,
      temFGTS: formData.temFGTS.toLowerCase().includes('sim') || formData.temFGTS.toLowerCase().includes('true'),
      possuiEntrada: formData.possuiEntrada.toLowerCase().includes('sim') || formData.possuiEntrada.toLowerCase().includes('true'),
      imovel: 'A definir',
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
      telefoneExtra: '',
      rendaFamiliar: '',
      temFGTS: '',
      possuiEntrada: ''
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
            <Label htmlFor="telefoneExtra">Telefone Extra</Label>
            <Input
              id="telefoneExtra"
              value={formData.telefoneExtra}
              onChange={(e) => setFormData({ ...formData, telefoneExtra: e.target.value })}
              placeholder="(11) 88888-8888"
            />
          </div>

          <div>
            <Label htmlFor="rendaFamiliar">Renda Familiar</Label>
            <Input
              id="rendaFamiliar"
              value={formData.rendaFamiliar}
              onChange={(e) => setFormData({ ...formData, rendaFamiliar: e.target.value })}
              placeholder="Ex: 5000"
              type="number"
            />
          </div>

          <div>
            <Label htmlFor="temFGTS">Tem FGTS?</Label>
            <Input
              id="temFGTS"
              value={formData.temFGTS}
              onChange={(e) => setFormData({ ...formData, temFGTS: e.target.value })}
              placeholder="Sim ou Não"
            />
          </div>

          <div>
            <Label htmlFor="possuiEntrada">Possui Entrada?</Label>
            <Input
              id="possuiEntrada"
              value={formData.possuiEntrada}
              onChange={(e) => setFormData({ ...formData, possuiEntrada: e.target.value })}
              placeholder="Sim ou Não"
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
