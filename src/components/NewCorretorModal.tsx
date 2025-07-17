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

const availableRoles = [
  { id: 'admin', label: 'Administrador', description: 'Acesso completo ao sistema, sem restrições' },
  { id: 'gestor', label: 'Gestor', description: 'Gerenciar leads, ver relatórios, gerenciar equipes' },
  { id: 'corretor', label: 'Corretor', description: 'Gerenciar apenas leads próprios' }
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
    role: 'corretor' as 'admin' | 'gestor' | 'corretor',
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
      // Criar usuário diretamente na tabela users (sem usar auth.admin)
      const userId = crypto.randomUUID();
      
      // Criptografar senha primeiro
      const { data: hashedPassword, error: hashError } = await supabase.rpc('crypt_password', { password: 'mudar123' });
      
      if (hashError || !hashedPassword) {
        console.error('Error hashing password:', hashError);
        toast.error('Erro ao processar senha');
        return;
      }
      
      // Criar registro na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: formData.email,
          name: formData.nome,
          telefone: formData.telefone,
          role: formData.role,
          equipe_id: formData.equipeId && formData.equipeId !== 'no-team' ? formData.equipeId : null,
          status: 'ativo',
          password_hash: hashedPassword
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user record:', userError);
        toast.error('Erro ao criar corretor: ' + userError.message);
        return;
      }

      // Criar permissões baseadas no role
      const permissions = {
        admin: {
          can_view_all_leads: true,
          can_invite_users: true,
          can_manage_leads: true,
          can_view_reports: true,
          can_access_configurations: true,
          can_manage_teams: true,
          can_manage_properties: true
        },
        gestor: {
          can_view_all_leads: true,
          can_invite_users: true,
          can_manage_leads: true,
          can_view_reports: true,
          can_access_configurations: false,
          can_manage_teams: true,
          can_manage_properties: true
        },
        corretor: {
          can_view_all_leads: false,
          can_invite_users: false,
          can_manage_leads: true,
          can_view_reports: false,
          can_access_configurations: false,
          can_manage_teams: false,
          can_manage_properties: false
        }
      };

      const { error: permissionsError } = await supabase
        .from('permissions')
        .insert({
          user_id: userId,
          ...permissions[formData.role]
        });

      if (permissionsError) {
        console.error('Error creating permissions:', permissionsError);
        toast.error('Erro ao criar permissões do usuário');
        return;
      }

      toast.success('Corretor criado com sucesso! O usuário pode fazer login com a senha padrão "mudar123".');
      
      // Criar objeto corretor para atualizar a interface
      const newCorretor: Partial<Corretor> = {
        id: userId,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        status: 'ativo',
        permissoes: [],
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
      role: 'corretor',
      equipeId: ''
    });
    onClose();
  };

  const handleRoleChange = (role: 'admin' | 'gestor' | 'corretor') => {
    setFormData(prev => ({
      ...prev,
      role
    }));
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
            <Label>Cargo e Permissões</Label>
            <div className="space-y-3 mt-2">
              {availableRoles.map((role) => (
                <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleRoleChange(role.id as 'admin' | 'gestor' | 'corretor')}>
                  <input
                    type="radio"
                    id={role.id}
                    name="role"
                    value={role.id}
                    checked={formData.role === role.id}
                    onChange={() => handleRoleChange(role.id as 'admin' | 'gestor' | 'corretor')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor={role.id} className="text-sm font-medium cursor-pointer">
                      {role.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
