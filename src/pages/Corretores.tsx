
import { useState, useEffect } from "react";
import { Corretor, Equipe } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewCorretorModal } from "@/components/NewCorretorModal";
import { EditCorretorModal } from "@/components/EditCorretorModal";
import { NewTeamModal } from "@/components/NewTeamModal";
import { EditTeamModal } from "@/components/EditTeamModal";
import { 
  Plus,
  User,
  Phone,
  Edit,
  Users,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const mockCorretores: Corretor[] = [
  {
    id: '1',
    nome: 'Maria Santos',
    email: 'maria@imobiliaria.com',
    telefone: '(11) 99999-9999',
    status: 'ativo',
    permissoes: ['leads', 'dashboards'],
    leads: ['1', '3', '5'],
    equipeId: '1',
    equipeNome: 'Equipe Zona Sul'
  },
  {
    id: '2',
    nome: 'Pedro Oliveira',
    email: 'pedro@imobiliaria.com',
    telefone: '(11) 88888-8888',
    status: 'ativo',
    permissoes: ['leads'],
    leads: ['2', '4', '6'],
    equipeId: '2',
    equipeNome: 'Equipe Barra'
  },
  {
    id: '3',
    nome: 'Ana Costa',
    email: 'ana@imobiliaria.com',
    telefone: '(11) 77777-7777',
    status: 'inativo',
    permissoes: ['leads'],
    leads: []
  }
];

const mockEquipes: Equipe[] = [
  {
    id: '1',
    nome: 'Equipe Zona Sul',
    responsavelId: '1',
    responsavelNome: 'Maria Santos',
    corretores: ['1']
  },
  {
    id: '2',
    nome: 'Equipe Barra',
    responsavelId: '2',
    responsavelNome: 'Pedro Oliveira',
    corretores: ['2']
  }
];

const Corretores = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Equipe | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do banco
  useEffect(() => {
    loadCorretores();
  }, []);

  const loadCorretores = async () => {
    try {
      setLoading(true);
      
      // Buscar corretores
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          telefone,
          status,
          role,
          permissions (
            can_view_all_leads,
            can_invite_users
          )
        `)
        .eq('role', 'corretor');

      if (usersError) {
        console.error('Error loading corretores:', usersError);
        toast.error('Erro ao carregar corretores');
        return;
      }

      // Contar leads para cada corretor
      const { data: leadsData } = await supabase
        .from('leads')
        .select('user_id');

      // Transformar dados para o formato da interface
      const formattedCorretores: Corretor[] = usersData?.map(user => {
        const permissions = user.permissions?.[0];
        const leadCount = leadsData?.filter(lead => lead.user_id === user.id).length || 0;
        
        const permissoesList = [];
        if (permissions?.can_view_all_leads) permissoesList.push('can_view_all_leads');
        if (permissions?.can_invite_users) permissoesList.push('can_invite_users');

        return {
          id: user.id,
          nome: user.name,
          email: user.email,
          telefone: user.telefone || '',
          status: user.status as 'ativo' | 'inativo' | 'pendente',
          permissoes: permissoesList,
          leads: Array(leadCount).fill('').map((_, i) => i.toString()), // Mock lead IDs
          equipeId: undefined,
          equipeNome: undefined
        };
      }) || [];

      setCorretores(formattedCorretores);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredCorretores = corretores
    .filter(corretor => {
      const matchesSearch = corretor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           corretor.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTeam = teamFilter === 'all' 
        ? true 
        : teamFilter === 'no-team' 
          ? !corretor.equipeId 
          : corretor.equipeId === teamFilter;
      
      return matchesSearch && matchesTeam;
    })
    .sort((a, b) => {
      // Corretores ativos primeiro
      if (a.status === 'ativo' && b.status === 'inativo') return -1;
      if (a.status === 'inativo' && b.status === 'ativo') return 1;
      return 0;
    });

  const toggleStatus = async (corretorId: string) => {
    const corretor = corretores.find(c => c.id === corretorId);
    if (!corretor) return;
    
    const newStatus = corretor.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      // Atualizar no banco
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', corretorId);

      if (error) {
        toast.error('Erro ao atualizar status do corretor');
        return;
      }

      // Atualizar localmente
      setCorretores(corretores.map(c =>
        c.id === corretorId
          ? { ...c, status: newStatus }
          : c
      ));

      toast.success(`Corretor ${newStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleCreateCorretor = (corretorData: Partial<Corretor>) => {
    const newCorretor = corretorData as Corretor;
    setCorretores([...corretores, newCorretor]);
    // Recarregar dados para sincronizar com o banco
    loadCorretores();
  };

  const handleUpdateCorretor = (corretorId: string, updates: Partial<Corretor>) => {
    setCorretores(corretores.map(corretor =>
      corretor.id === corretorId ? { ...corretor, ...updates } : corretor
    ));
  };

  const handleEditClick = (corretor: Corretor) => {
    setSelectedCorretor(corretor);
    setShowEditModal(true);
  };

  const handleCreateTeam = (teamData: Partial<Equipe>) => {
    const newTeam = teamData as Equipe;
    setEquipes([...equipes, newTeam]);
  };

  const handleUpdateTeam = (equipeId: string, updates: Partial<Equipe>) => {
    setEquipes(equipes.map(equipe =>
      equipe.id === equipeId ? { ...equipe, ...updates } : equipe
    ));
    
    // Atualizar os corretores que tiveram mudanças na equipe
    setCorretores(corretores.map(corretor => {
      // Se o corretor estava na equipe e foi removido
      if (corretor.equipeId === equipeId && !updates.corretores?.includes(corretor.id)) {
        return { ...corretor, equipeId: undefined, equipeNome: undefined };
      }
      // Se o corretor foi adicionado à equipe
      if (updates.corretores?.includes(corretor.id) && corretor.equipeId !== equipeId) {
        return { ...corretor, equipeId, equipeNome: updates.nome };
      }
      // Se o corretor permanece na equipe mas o nome da equipe mudou
      if (corretor.equipeId === equipeId && updates.nome) {
        return { ...corretor, equipeNome: updates.nome };
      }
      return corretor;
    }));
  };

  const handleDeleteTeam = (equipeId: string) => {
    setEquipes(equipes.filter(equipe => equipe.id !== equipeId));
    
    // Remover a equipe dos corretores
    setCorretores(corretores.map(corretor =>
      corretor.equipeId === equipeId
        ? { ...corretor, equipeId: undefined, equipeNome: undefined }
        : corretor
    ));
  };

  const handleEditTeamClick = (equipe: Equipe) => {
    setSelectedTeam(equipe);
    setShowEditTeamModal(true);
  };

  console.log('Corretores page rendering, teamFilter:', teamFilter, 'equipes:', equipes);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Corretores</h1>
          <p className="text-gray-600 mt-1">
            Gerencie sua equipe de corretores e suas permissões
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Corretor
          </Button>
          {user?.role === 'admin' && (
            <Button variant="outline" onClick={() => navigate('/equipes')}>
              <Users className="w-4 h-4 mr-2" />
              Gerenciar Equipes
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {corretores.filter(c => c.status === 'ativo').length}
                </p>
                <p className="text-sm text-gray-600">Corretores Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {corretores.filter(c => c.status === 'inativo').length}
                </p>
                <p className="text-sm text-gray-600">Corretores Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{corretores.length}</p>
                <p className="text-sm text-gray-600">Total de Corretores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar corretores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Filtrar por equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as equipes</SelectItem>
                <SelectItem value="no-team">Sem equipe</SelectItem>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      {/* Lista de Corretores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCorretores.map((corretor) => (
          <Card key={corretor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{corretor.nome}</CardTitle>
                    <p className="text-sm text-gray-600">{corretor.email}</p>
                  </div>
                </div>
                <Badge 
                  variant={corretor.status === 'ativo' ? 'default' : 'secondary'}
                  className={corretor.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                >
                  {corretor.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{corretor.telefone}</span>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Permissões:</p>
                  <div className="flex flex-wrap gap-1">
                    {corretor.permissoes.map((permissao) => (
                      <Badge key={permissao} variant="outline" className="text-xs">
                        {permissao}
                      </Badge>
                    ))}
                  </div>
                </div>

                {corretor.equipeNome && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{corretor.equipeNome}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Leads Ativos:</span>
                  <span className="font-medium">{corretor.leads.length}</span>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditClick(corretor)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant={corretor.status === 'ativo' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleStatus(corretor.id)}
                  >
                    {corretor.status === 'ativo' ? 'Inativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <NewCorretorModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreateCorretor={handleCreateCorretor}
        equipes={equipes}
      />

      <EditCorretorModal
        corretor={selectedCorretor}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCorretor(null);
        }}
        onUpdateCorretor={handleUpdateCorretor}
        equipes={equipes}
      />

    </div>
  );
};

export default Corretores;
