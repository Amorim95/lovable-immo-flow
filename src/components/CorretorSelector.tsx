import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface CorretorSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (userId: string, userName: string) => void;
  currentCorretorName?: string;
}

export function CorretorSelector({ isOpen, onClose, onSelect, currentCorretorName }: CorretorSelectorProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsuarios();
    }
  }, [isOpen]);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, status')
        .eq('status', 'ativo')
        .order('name');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de corretores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (usuario: Usuario) => {
    console.log('Selecionando usuário para transferência:', usuario);
    onSelect(usuario.id, usuario.name);
    onClose();
    setSearchTerm("");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gestor': return 'Gestor';
      case 'corretor': return 'Corretor';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-50';
      case 'gestor': return 'text-blue-600 bg-blue-50';
      case 'corretor': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Transferir Lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentCorretorName && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="text-sm text-blue-800">Corretor atual:</Label>
              <p className="font-medium text-blue-900">{currentCorretorName}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Buscar novo corretor</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Digite o nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Selecione o novo responsável:</Label>
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-1">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Carregando corretores...
                  </div>
                ) : filteredUsuarios.length > 0 ? (
                  filteredUsuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelect(usuario)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-white">
                          {usuario.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {usuario.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {usuario.email}
                        </p>
                        <span className={`inline-block text-xs px-2 py-1 rounded ${getRoleColor(usuario.role)}`}>
                          {getRoleLabel(usuario.role)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'Nenhum corretor encontrado' : 'Nenhum corretor disponível'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}