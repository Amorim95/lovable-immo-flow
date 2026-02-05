import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Mail, Phone, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { NewCorretorModal } from "@/components/NewCorretorModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useManagerTeam } from "@/hooks/useManagerTeam";
import { toast } from "sonner";

interface Corretor {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: string;
  status: string;
  equipeId?: string;
  equipeNome?: string;
}

interface EquipeSimple {
  id: string;
  nome: string;
  responsavel_nome?: string;
}

export default function MobileCorretores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipeId, setSelectedEquipeId] = useState<string | null>(null);
  const [isNewCorretorModalOpen, setIsNewCorretorModalOpen] = useState(false);
  const { isAdmin, isGestor } = useUserRole();
  const { managedTeamId, loading: teamLoading } = useManagerTeam();

  const canManageUsers = isAdmin || isGestor;

  // Pré-selecionar equipe se o usuário for responsável
  useEffect(() => {
    if (!teamLoading && managedTeamId && !selectedEquipeId) {
      setSelectedEquipeId(managedTeamId);
    }
  }, [teamLoading, managedTeamId, selectedEquipeId]);

  // Buscar usuários
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['mobile-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) throw error;

      return data.map(user => ({
        id: user.id,
        nome: user.name,
        email: user.email,
        telefone: user.telefone,
        role: user.role,
        status: user.status,
        equipeId: user.equipe_id,
        equipeNome: undefined
      }));
    },
    enabled: canManageUsers
  });

  // Buscar equipes
  const { data: equipes = [] } = useQuery({
    queryKey: ['mobile-equipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nome');

      if (error) throw error;

      return data.map(equipe => ({
        id: equipe.id,
        nome: equipe.nome,
        responsavel_nome: equipe.responsavel_nome
      }));
    },
    enabled: canManageUsers
  }) as { data: EquipeSimple[] };

  const corretoresWithEquipes = users.map(user => ({
    ...user,
    equipeNome: equipes.find(e => e.id === user.equipeId)?.nome
  }));

  const filteredCorretores = corretoresWithEquipes
    .filter(corretor => {
      const matchesSearch = corretor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        corretor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (corretor.equipeNome && corretor.equipeNome.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTeam = !selectedEquipeId || corretor.equipeId === selectedEquipeId;
      
      return matchesSearch && matchesTeam;
    })
    // Ordenar: ativos primeiro, depois inativos, e dentro de cada grupo por nome
    .sort((a, b) => {
      if (a.status === 'ativo' && b.status !== 'ativo') return -1;
      if (a.status !== 'ativo' && b.status === 'ativo') return 1;
      return a.nome.localeCompare(b.nome);
    });


  const handleToggleStatus = async (e: React.MouseEvent, corretor: Corretor) => {
    e.stopPropagation();
    
    const newStatus = corretor.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', corretor.id);

      if (error) throw error;

      toast.success(`Status alterado para ${newStatus}`);
      refetchUsers();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleUpdateCorretor = (corretorId: string, updates: any) => {
    refetchUsers();
  };

  const handleCreateCorretor = () => {
    refetchUsers();
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 dark:bg-background">
        <MobileHeader title="Corretores" />
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-gray-500">Você não tem permissão para gerenciar usuários.</p>
          </div>
        </div>
      </div>
    );
  }

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 dark:bg-background">
        <MobileHeader title="Corretores" />
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 dark:bg-background">
      <MobileHeader
        title="Gestão de Usuários"
        rightElement={
          <Button
            size="sm"
            onClick={() => setIsNewCorretorModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Team Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={selectedEquipeId || 'all'} onValueChange={(value) => setSelectedEquipeId(value === 'all' ? null : value)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Todas as equipes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as equipes</SelectItem>
              {equipes.map((equipe) => (
                <SelectItem key={equipe.id} value={equipe.id}>
                  <div className="flex flex-col text-left">
                    <span className="font-medium">{equipe.nome}</span>
                    {equipe.responsavel_nome && (
                      <span className="text-xs text-muted-foreground">
                        Resp: {equipe.responsavel_nome}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="px-4 space-y-3">
        {filteredCorretores.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          filteredCorretores.map((corretor) => (
            <div
              key={corretor.id}
              className="bg-white dark:bg-card rounded-lg p-4 shadow-sm border relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-foreground truncate">{corretor.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <p className="text-sm text-gray-500 truncate">{corretor.email}</p>
                  </div>
                  {corretor.telefone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <p className="text-sm text-gray-500">{corretor.telefone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserRoleBadge role={corretor.role as any} />
                    <Badge 
                      variant={
                        corretor.status === 'ativo' ? 'default' : 
                        corretor.status === 'pendente' ? 'secondary' : 
                        'destructive'
                      }
                      className={`cursor-pointer hover:opacity-80 active:scale-95 transition-all px-4 py-1.5 text-sm ${
                        corretor.status === 'ativo' ? 'bg-green-100 text-green-800' : 
                        corretor.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                      onClick={(e) => handleToggleStatus(e, corretor)}
                    >
                      {corretor.status === 'pendente' ? 'Aguardando' : corretor.status}
                    </Badge>
                  </div>
                  {corretor.equipeNome && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{corretor.equipeNome}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <NewCorretorModal
        isOpen={isNewCorretorModalOpen}
        onClose={() => setIsNewCorretorModalOpen(false)}
        onCreateCorretor={handleCreateCorretor}
        equipes={equipes as any}
      />
    </div>
  );
}