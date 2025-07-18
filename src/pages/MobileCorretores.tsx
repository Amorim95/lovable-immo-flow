import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { NewCorretorModal } from "@/components/NewCorretorModal";
import { EditUsuarioModal } from "@/components/EditUsuarioModal";
import { useUserRole } from "@/hooks/useUserRole";

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
  const [isNewCorretorModalOpen, setIsNewCorretorModalOpen] = useState(false);
  const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { isAdmin, isGestor } = useUserRole();

  const canManageUsers = isAdmin || isGestor;

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

  const filteredCorretores = corretoresWithEquipes.filter(corretor =>
    corretor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corretor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (corretor.equipeNome && corretor.equipeNome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCorretorClick = (corretor: Corretor) => {
    setSelectedCorretor(corretor);
    setIsEditModalOpen(true);
  };

  const handleUpdateCorretor = (corretorId: string, updates: any) => {
    refetchUsers();
  };

  const handleCreateCorretor = () => {
    refetchUsers();
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
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
      <div className="min-h-screen bg-gray-50 pb-20">
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title="Gestão de Usuários"
        rightElement={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Navigate to teams */}}
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewCorretorModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total de Usuários</span>
            <span className="font-semibold text-gray-900">{users.length}</span>
          </div>
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
              onClick={() => handleCorretorClick(corretor)}
              className="bg-white rounded-lg p-4 shadow-sm border active:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{corretor.nome}</h3>
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
                <div className="flex flex-col gap-1 items-end">
                  <UserRoleBadge role={corretor.role as any} />
                  <Badge variant={corretor.status === 'ativo' ? 'default' : 'secondary'}>
                    {corretor.status}
                  </Badge>
                </div>
              </div>
              
              {corretor.equipeNome && (
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-600">{corretor.equipeNome}</span>
                </div>
              )}
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

      {selectedCorretor && (
        <EditUsuarioModal
          corretor={selectedCorretor as any}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCorretor(null);
          }}
          onUpdateCorretor={handleUpdateCorretor}
          equipes={equipes as any}
        />
      )}
    </div>
  );
}