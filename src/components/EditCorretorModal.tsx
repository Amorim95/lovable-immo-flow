
import { useState, useEffect } from "react";
import { Corretor } from "@/types/crm";
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
import { Edit } from "lucide-react";

interface EditCorretorModalProps {
  corretor: Corretor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCorretor: (corretorId: string, updates: Partial<Corretor>) => void;
}

const availablePermissions = [
  { id: 'leads', label: 'Gerenciar Leads' },
  { id: 'dashboards', label: 'Visualizar Dashboards' },
  { id: 'imoveis', label: 'Gerenciar Imóveis' },
  { id: 'corretores', label: 'Gerenciar Corretores' },
  { id: 'filas', label: 'Configurar Filas' },
  { id: 'configuracoes', label: 'Configurações Gerais' }
];

export function EditCorretorModal({ corretor, isOpen, onClose, onUpdateCorretor }: EditCorretorModalProps) {
  const [formData, setFormData] = useState({
    numero: '',
    nome: '',
    email: '',
    telefone: '',
    permissoes: [] as string[]
  });

  useEffect(() => {
    if (corretor) {
      setFormData({
        numero: corretor.numero || '',
        nome: corretor.nome || '',
        email: corretor.email || '',
        telefone: corretor.telefone || '',
        permissoes: corretor.permissoes || []
      });
    }
  }, [corretor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!corretor || !formData.nome.trim() || !formData.email.trim() || !formData.numero.trim()) {
      alert('Número, Nome e Email são obrigatórios');
      return;
    }

    onUpdateCorretor(corretor.id, {
      numero: formData.numero,
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      permissoes: formData.permissoes
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

  if (!corretor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Corretor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="numero">Número do Corretor *</Label>
            <Input
              id="numero"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              placeholder="Ex: 001"
              required
            />
          </div>

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
