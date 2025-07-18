import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  equipe_id: string | null;
}

interface UserFilterProps {
  onUserChange: (userId: string | null) => void;
  selectedUserId: string | null;
}

export function UserFilter({ 
  onUserChange, 
  selectedUserId
}: UserFilterProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
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
      console.error('Error loading user filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(user =>
    user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleUserChange = (value: string) => {
    const userId = value === 'all' ? null : value;
    onUserChange(userId);
  };

  if (loading) {
    return (
      <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
    );
  }

  return (
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
          <div className="p-2 border-b">
            <Input
              placeholder="Buscar usuário..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="h-8"
            />
          </div>
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
  );
}