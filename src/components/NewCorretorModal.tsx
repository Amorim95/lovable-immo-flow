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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewCorretorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCorretor: (corretorData: Partial<Corretor>) => void;
  equipes?: Equipe[];
}

const availablePermissions = [
  { id: 'can_view_all_leads', label: 'Visualizar Todos os Leads' },
  { id: 'can_invite_users', label: 'Convidar Usuários' },
  { id: 'can_manage_leads', label: 'Gerenciar Leads' },
  { id: 'can_view_reports', label: 'Ver Relatórios' },
  { id: 'can_manage_properties', label: 'Gerenciar Imóveis' },
  { id: 'can_manage_teams', label: 'Gerenciar Equipes' },
  { id: 'can_access_configurations', label: 'Acessar Configurações' }
];

export function NewCorretorModal({ isOpen, onClose, onCreateCorretor, equipes = [] }: NewCorretorModalProps) {
  const [equipesFromDB, setEquipesFromDB] = useState<Equipe[]>([]);
  const [loadingEquipes, setLoadingEquipes] = useState(true);

  // Carregar equipes do banco de dados
  useEffect(() => {
    loadEquipes();
  }, [isOpen]);

  const loadEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Error loading equipes:', error);
        return;
      }

      // Transformar dados do banco para o formato esperado
      const equipesFormatted = (data || []).map(equipe => ({
        id: equipe.id,
        nome: equipe.nome,
        responsavelId: equipe.responsavel_id,
        responsavelNome: equipe.responsavel_nome,
        corretores: [] // Will be populated when needed
      }));
      setEquipesFromDB(equipesFormatted);
    } catch (error) {
      console.error('Error loading equipes:', error);
    } finally {
      setLoadingEquipes(false);
    }
  };
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    permissoes: [] as string[],
    equipeId: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.email.trim()) {
      toast.error('Nome e Email são obrigatórios');
      return;
    }

    setIsLoading(true);
    
    try {
      // Chamar edge function para criar corretor e enviar email
      const { data, error } = await supabase.functions.invoke('send-corretor-invitation', {
        body: {
          email: formData.email,
          name: formData.nome,
          telefone: formData.telefone,
          permissions: formData.permissoes,
          equipe_id: formData.equipeId && formData.equipeId !== 'no-team' ? formData.equipeId : null
        }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        toast.error('Erro ao criar corretor: ' + error.message);
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'Erro ao criar corretor');
        return;
      }

      toast.success('Corretor criado com sucesso! Email de confirmação enviado.');
      
      // Criar objeto corretor para atualizar a interface
      const newCorretor: Partial<Corretor> = {
        id: data.user.id,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        status: 'pendente',
        permissoes: formData.permissoes,
        leads: [],
        equipeId: formData.equipeId === 'no-team' ? undefined : (formData.equipeId || undefined),
        equipeNome: equipesFromDB.find(e => e.id === formData.equipeId)?.nome
      };

      onCreateCorretor(newCorretor);
      handleClose();
      
    } catch (error: any) {
      console.error('Error creating corretor:', error);
      toast.error('Erro ao criar corretor');
    } finally {
      setIsLoading(false);
    }
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
                {loadingEquipes ? (
                  <SelectItem value="loading" disabled>
                    Carregando equipes...
                  </SelectItem>
                ) : equipesFromDB.length > 0 ? (
                  equipesFromDB.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-teams" disabled>
                    Nenhuma equipe encontrada
                  </SelectItem>
                )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Corretor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
