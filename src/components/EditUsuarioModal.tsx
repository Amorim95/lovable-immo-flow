import { useState, useEffect } from "react";
import { Corretor, Equipe } from "@/types/crm";
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
import { Edit } from "lucide-react";

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
  { value: 'corretor', label: 'Corretor' }
];

export function EditUsuarioModal({ corretor, isOpen, onClose, onUpdateCorretor, equipes = [] }: EditUsuarioModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'corretor',
    equipeId: ''
  });

  useEffect(() => {
    if (corretor) {
      setFormData({
        nome: corretor.nome || '',
        email: corretor.email || '',
        telefone: corretor.telefone || '',
        role: corretor.role || 'corretor',
        equipeId: corretor.equipeId || 'no-team'
      });
    }
  }, [corretor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!corretor || !formData.nome.trim() || !formData.email.trim()) {
      alert('Nome e Email são obrigatórios');
      return;
    }

    const equipeSelecionada = formData.equipeId !== 'no-team' ? equipes.find(e => e.id === formData.equipeId) : null;
    
    onUpdateCorretor(corretor.id, {
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      role: formData.role as 'admin' | 'gestor' | 'corretor',
      equipeId: formData.equipeId === 'no-team' ? undefined : formData.equipeId,
      equipeNome: equipeSelecionada?.nome || undefined
    });
    
    onClose();
  };

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
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}