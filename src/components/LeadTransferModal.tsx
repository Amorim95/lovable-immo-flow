import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'corretor';
  status: 'ativo' | 'inativo' | 'pendente';
  equipe_id?: string;
}

interface LeadTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  currentOwnerId: string;
  currentOwnerName: string;
  onTransferComplete: (newUserId?: string, newUserName?: string) => void;
}

export function LeadTransferModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  currentOwnerId,
  currentOwnerName,
  onTransferComplete
}: LeadTransferModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filtrar usuários baseado no termo de busca
    if (searchTerm.trim() === '') {
      setFilteredUsers(users.filter(user => user.id !== currentOwnerId));
    } else {
      setFilteredUsers(
        users.filter(user => 
          user.id !== currentOwnerId && (
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      );
    }
  }, [searchTerm, users, currentOwnerId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, status, equipe_id')
        .order('name');

      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUserId) return;

    setTransferring(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ user_id: selectedUserId })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'Lead transferido',
        description: `Lead "${leadName}" foi transferido com sucesso.`,
      });

      // Encontrar o nome do novo usuário selecionado
      const newUser = users.find(u => u.id === selectedUserId);
      
      // Aguardar um pouco para o usuário ver o feedback e fechar o modal
      setTimeout(() => {
        onTransferComplete(selectedUserId, newUser?.name || 'Novo Corretor');
      }, 500);
    } catch (error) {
      console.error('Erro ao transferir lead:', error);
      toast({
        title: 'Erro na transferência',
        description: 'Não foi possível transferir o lead. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUserId(null);
    onClose();
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: 'Administrador',
      gestor: 'Gestor',
      corretor: 'Corretor'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getStatusVariant = (status: string) => {
    return status === 'ativo' ? 'default' : 'secondary';
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle>Transferir Lead</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Lead: <strong>{leadName}</strong>
            <br />
            Proprietário atual: <strong>{currentOwnerName}</strong>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barra de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar usuário por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Lista de usuários */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Carregando usuários...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário disponível.'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 hover-scale ${
                      selectedUserId === user.id 
                        ? 'bg-primary/10 border-primary border animate-scale-in' 
                        : 'hover:bg-muted/50'
                    }`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedUserId(user.id);
                    }}
                  >
                    <Avatar className="w-8 h-8">
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                    </div>
                    
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline" className="text-xs">
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge variant={getStatusVariant(user.status)} className="text-xs">
                        {user.status === 'ativo' ? 'Ativo' : user.status === 'inativo' ? 'Inativo' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usuário selecionado */}
          {selectedUser && (
            <div className="bg-muted/30 p-3 rounded-lg border">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Transferindo para:
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                </Avatar>
                <span className="font-medium">{selectedUser.name}</span>
                <Badge variant="outline" className="text-xs">
                  {getRoleLabel(selectedUser.role)}
                </Badge>
                <Badge variant={getStatusVariant(selectedUser.status)} className="text-xs">
                  {selectedUser.status === 'ativo' ? 'Ativo' : selectedUser.status === 'inativo' ? 'Inativo' : 'Pendente'}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!selectedUserId || transferring}
          >
            {transferring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transferindo...
              </>
            ) : (
              'Transferir Lead'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}