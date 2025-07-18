import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Edit, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NewTeamModal } from "@/components/NewTeamModal";
import { EditTeamModal } from "@/components/EditTeamModal";
import { useUserRole } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Equipe {
  id: string;
  nome: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  created_at: string;
  membros?: number;
}

export default function MobileEquipes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResponsavel, setFilterResponsavel] = useState<string>('all');
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Equipe | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { isAdmin, isGestor } = useUserRole();

  const canManageTeams = isAdmin || isGestor;

  // Buscar equipes
  const { data: equipes = [], isLoading, refetch } = useQuery({
    queryKey: ['mobile-equipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipes')
        .select(`
          *,
          users!equipes_responsavel_id_fkey(name)
        `)
        .order('nome');

      if (error) throw error;

      return data.map(equipe => ({
        id: equipe.id,
        nome: equipe.nome,
        responsavel_id: equipe.responsavel_id,
        responsavel_nome: equipe.responsavel_nome || equipe.users?.name || 'Não definido',
        created_at: equipe.created_at,
        membros: 0 // TODO: calcular membros
      }));
    },
    enabled: canManageTeams
  });

  // Buscar responsáveis para filtro
  const { data: responsaveis = [] } = useQuery({
    queryKey: ['responsaveis-equipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .in('role', ['admin', 'gestor'])
        .eq('status', 'ativo')
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: canManageTeams
  });

  const filteredEquipes = equipes.filter(equipe => {
    const matchesSearch = equipe.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (equipe.responsavel_nome && equipe.responsavel_nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterResponsavel === 'all' || equipe.responsavel_id === filterResponsavel;
    
    return matchesSearch && matchesFilter;
  });

  const handleTeamClick = (equipe: Equipe) => {
    setSelectedTeam(equipe);
    setIsEditModalOpen(true);
  };

  const handleUpdateTeam = () => {
    refetch();
  };

  const handleCreateTeam = () => {
    refetch();
  };

  if (!canManageTeams) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Equipes" />
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-gray-500">Você não tem permissão para gerenciar equipes.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Equipes" />
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title="Gerenciar Equipes"
        rightElement={
          <Button
            size="sm"
            onClick={() => setIsNewTeamModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </Button>
        }
      />

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar equipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar Equipes</span>
          </div>
          <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {responsaveis.map((responsavel) => (
                <SelectItem key={responsavel.id} value={responsavel.id}>
                  {responsavel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total de Equipes</span>
            <span className="font-semibold text-gray-900">{equipes.length}</span>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="px-4 space-y-3">
        {filteredEquipes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma equipe encontrada</p>
          </div>
        ) : (
          filteredEquipes.map((equipe) => (
            <div
              key={equipe.id}
              onClick={() => handleTeamClick(equipe)}
              className="bg-white rounded-lg p-4 shadow-sm border active:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{equipe.nome}</h3>
                  <p className="text-sm text-gray-500 truncate">
                    Responsável: {equipe.responsavel_nome}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTeamClick(equipe);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{equipe.membros} membros</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(equipe.created_at).toLocaleDateString('pt-BR')}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <NewTeamModal
        isOpen={isNewTeamModalOpen}
        onClose={() => setIsNewTeamModalOpen(false)}
        onCreateTeam={handleCreateTeam}
        corretores={[]}
      />

      {selectedTeam && (
        <EditTeamModal
          equipe={selectedTeam as any}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTeam(null);
          }}
          onUpdateTeam={handleUpdateTeam}
          onDeleteTeam={() => {}}
          corretores={[]}
        />
      )}
    </div>
  );
}