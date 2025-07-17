
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast.error('Nome e Telefone são obrigatórios');
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsLoading(true);

    try {
      // Inserir lead na tabela public.leads
      const { data, error } = await supabase
        .from('leads')
        .insert({
          nome: formData.nome,
          telefone: formData.telefone,
          dados_adicionais: formData.dadosAdicionais || null,
          etapa: 'aguardando-atendimento',
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        toast.error('Erro ao criar lead');
        return;
      }

      // Criar objeto lead para atualizar a interface
      const newLead: Partial<Lead> = {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone,
        dadosAdicionais: data.dados_adicionais,
        dataCriacao: new Date(data.created_at),
        etapa: data.etapa as any,
        etiquetas: [],
        corretor: user.name,
        atividades: [],
        status: 'ativo'
      };

      onCreateLead(newLead);
      toast.success('Lead criado com sucesso!');
      handleClose();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead');
    } finally {
      setIsLoading(false);
    }
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
