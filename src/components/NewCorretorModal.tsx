
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface NewCorretorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCorretor: (corretorData: Partial<Corretor>) => void;
  equipes?: Equipe[];
}

const availablePermissions = [
  { id: 'leads', label: 'Gerenciar Leads' },
  { id: 'dashboards', label: 'Visualizar Dashboards' },
  { id: 'corretores', label: 'Gerenciar Corretores' },
  { id: 'configuracoes', label: 'Configurações Gerais' }
];

export function NewCorretorModal({ isOpen, onClose, onCreateCorretor, equipes = [] }: NewCorretorModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    permissoes: [] as string[],
    equipeId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.email.trim()) {
      alert('Nome e Email são obrigatórios');
      return;
    }

    const equipeSelecionada = formData.equipeId && formData.equipeId !== 'no-team' ? equipes.find(e => e.id === formData.equipeId) : null;
    
    const newCorretor: Partial<Corretor> = {
      id: Date.now().toString(),
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      status: 'ativo',
      permissoes: formData.permissoes,
      leads: [],
      equipeId: formData.equipeId === 'no-team' ? undefined : (formData.equipeId || undefined),
      equipeNome: equipeSelecionada?.nome || undefined
    };

    onCreateCorretor(newCorretor);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      permissoes: [],
      equipeId: ''
    });
    onClose();
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissoes: [...prev.permissoes, permission]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissoes: prev.permissoes.filter(p => p !== permission)
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Corretor
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
            <Label htmlFor="equipe">Equipe (Opcional)</Label>
            <Select value={formData.equipeId} onValueChange={(value) => setFormData({ ...formData, equipeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma equipe" />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Permissões e Acessos</Label>
            <div className="space-y-2 mt-2">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission.id}
                    checked={formData.permissoes.includes(permission.id)}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(permission.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={permission.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.label}
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
              Criar Corretor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
