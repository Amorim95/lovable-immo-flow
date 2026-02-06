import { useState, useEffect } from "react";
import { Corretor, Equipe } from "@/types/crm";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const { addCompanyFilter, getCompanyId } = useCompanyFilter();
  const isMobile = useIsMobile();

  // Carregar equipes do banco de dados
  useEffect(() => {
    loadEquipes();
  }, [isOpen]);

  const loadEquipes = async () => {
    try {
      let query = supabase
        .from('equipes')
        .select('*')
        .order('nome');
      
      query = addCompanyFilter(query);
      const { data, error } = await query;

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
      // Chamar edge function para criar usuário
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          name: formData.nome,
          telefone: formData.telefone,
          role: formData.role,
          equipeId: formData.equipeId,
          companyId: getCompanyId()
        }
      });

      if (error || data.error) {
        console.error('Error creating user:', error || data.error);
        toast.error(data?.error || 'Erro ao criar usuário');
        return;
      }

      // Criar objeto corretor para atualizar a interface
      const newCorretor: Partial<Corretor> = {
        id: data.user.id,
        nome: data.user.name,
        email: data.user.email,
        telefone: data.user.telefone,
        role: data.user.role as any,
        equipeId: data.user.equipe_id,
        equipeNome: equipesFromDB.find(e => e.id === data.user.equipe_id)?.nome || 'Sem equipe',
        status: data.user.status as any,
        permissoes: []
      };

      onCreateCorretor(newCorretor);
      toast.success(`${formData.role === 'corretor' ? 'Corretor' : 'Usuário'} criado com sucesso! Senha temporária: ${data.tempPassword}`);
      handleClose();
    } catch (error) {
      console.error('Error creating corretor:', error);
      toast.error('Erro ao criar usuário');
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
      <DialogContent className={isMobile ? "max-w-[95vw] max-h-[50vh] overflow-y-auto p-4" : "max-w-md"}>
        <DialogHeader className={isMobile ? "pb-2" : ""}>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4" />
            Novo Corretor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={isMobile ? "space-y-3" : "space-y-4"}>
          <div>
            <Label htmlFor="nome" className={isMobile ? "text-sm" : ""}>Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
              required
              className={isMobile ? "h-9 text-sm" : ""}
            />
          </div>

          <div>
            <Label htmlFor="email" className={isMobile ? "text-sm" : ""}>Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
              className={isMobile ? "h-9 text-sm" : ""}
            />
          </div>

          <div>
            <Label htmlFor="telefone" className={isMobile ? "text-sm" : ""}>Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              className={isMobile ? "h-9 text-sm" : ""}
            />
          </div>

          <div>
            <Label htmlFor="equipe" className={isMobile ? "text-sm" : ""}>Equipe (Opcional)</Label>
            <Select value={formData.equipeId} onValueChange={(value) => setFormData({ ...formData, equipeId: value })}>
              <SelectTrigger className={isMobile ? "h-9 text-sm" : ""}>
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
            <Label className={isMobile ? "text-sm" : ""}>Cargo</Label>
            {isMobile ? (
              /* Versão mobile: RadioGroup compacto em linha */
              <RadioGroup 
                value={formData.role} 
                onValueChange={(value) => handleRoleChange(value as 'admin' | 'gestor' | 'corretor')}
                className="flex gap-4 mt-2"
              >
                {availableRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-1.5">
                    <RadioGroupItem value={role.id} id={`mobile-${role.id}`} />
                    <Label 
                      htmlFor={`mobile-${role.id}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {role.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              /* Versão desktop: cards com descrições */
              <div className="space-y-3 mt-2">
                {availableRoles.map((role) => (
                  <div 
                    key={role.id} 
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" 
                    onClick={() => handleRoleChange(role.id as 'admin' | 'gestor' | 'corretor')}
                  >
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
            )}
          </div>

          <div className={`flex justify-end gap-2 ${isMobile ? "pt-2" : "pt-4"}`}>
            <Button type="button" variant="outline" onClick={handleClose} size={isMobile ? "sm" : "default"}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} size={isMobile ? "sm" : "default"}>
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
