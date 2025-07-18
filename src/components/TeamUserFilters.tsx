import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Users, User } from "lucide-react";

interface Equipe {
  id: string;
  nome: string;
  responsavel_nome: string | null;
}

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  equipe_id: string | null;
}

interface TeamUserFiltersProps {
  onTeamChange: (teamId: string | null) => void;
  onUserChange: (userId: string | null) => void;
  selectedTeamId: string | null;
  selectedUserId: string | null;
}

export function TeamUserFilters({ 
  onTeamChange, 
  onUserChange, 
  selectedTeamId, 
  selectedUserId 
}: TeamUserFiltersProps) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar equipes
      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes')
        .select('id, nome, responsavel_nome')
        .order('nome');

      if (equipesError) {
        console.error('Error loading equipes:', equipesError);
      } else {
        setEquipes(equipesData || []);
      }

      // Carregar usuários ativos
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('users')
        .select('id, name, email, role, equipe_id')
        .eq('status', 'ativo')
        .order('name');

      if (usuariosError) {
        console.error('Error loading users:', usuariosError);
      } else {
        setUsuarios(usuariosData || []);
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários baseado na equipe selecionada
  const usuariosFiltrados = selectedTeamId 
    ? usuarios.filter(user => user.equipe_id === selectedTeamId)
    : usuarios;

  const handleTeamChange = (value: string) => {
    const teamId = value === 'all' ? null : value;
    onTeamChange(teamId);
    
    // Se mudou a equipe, resetar a seleção de usuário se o usuário não faz parte da nova equipe
    if (selectedUserId && teamId) {
      const userInTeam = usuarios.find(u => u.id === selectedUserId && u.equipe_id === teamId);
      if (!userInTeam) {
        onUserChange(null);
      }
    }
  };

  const handleUserChange = (value: string) => {
    const userId = value === 'all' ? null : value;
    onUserChange(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Filtro por Equipe */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          <Users className="w-4 h-4" />
          Filtrar por Equipe
        </Label>
        <Select value={selectedTeamId || 'all'} onValueChange={handleTeamChange}>
          <SelectTrigger className="w-48">
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

      {/* Filtro por Usuário */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          <User className="w-4 h-4" />
          Filtrar por Usuário
        </Label>
        <Select value={selectedUserId || 'all'} onValueChange={handleUserChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os usuários" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">Todos os usuários</SelectItem>
            {usuariosFiltrados.map((usuario) => (
              <SelectItem key={usuario.id} value={usuario.id}>
                <div className="flex flex-col text-left">
                  <span className="font-medium">{usuario.name}</span>
                  <span className="text-xs text-muted-foreground">{usuario.email}</span>
                  <span className="text-xs text-muted-foreground capitalize">{usuario.role}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}