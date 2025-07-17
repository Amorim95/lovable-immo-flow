import { useState, useEffect } from "react";
import { Corretor, Equipe } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewCorretorModal } from "@/components/NewCorretorModal";
import { EditCorretorModal } from "@/components/EditCorretorModal";
import { AccessControlWrapper } from "@/components/AccessControlWrapper";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { 
  Plus,
  User,
  Phone,
  Edit,
  Users,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Corretores = () => {
  const { user } = useAuth();
  const { isAdmin, isGestor } = useUserRole();
  const navigate = useNavigate();
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários baseado no papel do usuário atual
      let usersQuery = supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          telefone,
          status,
          role,
          equipe_id,
          permissions (
            can_view_all_leads,
            can_invite_users,
            can_manage_leads,
            can_view_reports,
            can_manage_properties,
            can_manage_teams,
            can_access_configurations
          )
        `);

      // Se for gestor, mostrar apenas usuários da sua equipe
      if (isGestor && !isAdmin) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('equipe_id')
          .eq('id', user?.id)
          .single();
        
        if (currentUser?.equipe_id) {
          usersQuery = usersQuery.eq('equipe_id', currentUser.equipe_id);
        }
      }

      const { data: usersData, error: usersError } = await usersQuery;

      if (usersError) {
        console.error('Error loading users:', usersError);
        toast.error('Erro ao carregar usuários');
        return;
      }

      // Contar leads para cada usuário
      const { data: leadsData } = await supabase
        .from('leads')
        .select('user_id');

      // Transformar dados para o formato da interface
      const formattedCorretores: Corretor[] = usersData?.map(userData => {
        const permissions = userData.permissions?.[0];
        const leadCount = leadsData?.filter(lead => lead.user_id === userData.id).length || 0;
        
        const permissoesList = [];
        if (permissions?.can_view_all_leads) permissoesList.push('Visualizar Todos os Leads');
        if (permissions?.can_invite_users) permissoesList.push('Convidar Usuários');
        if (permissions?.can_manage_leads) permissoesList.push('Gerenciar Leads');
        if (permissions?.can_view_reports) permissoesList.push('Ver Relatórios');
        if (permissions?.can_manage_properties) permissoesList.push('Gerenciar Imóveis');
        if (permissions?.can_manage_teams) permissoesList.push('Gerenciar Equipes');
        if (permissions?.can_access_configurations) permissoesList.push('Acessar Configurações');

        return {
          id: userData.id,
          nome: userData.name,
          email: userData.email,
          telefone: userData.telefone || '',
          status: userData.status as 'ativo' | 'inativo' | 'pendente',
          permissoes: permissoesList,
          leads: Array(leadCount).fill('').map((_, i) => i.toString()),
          equipeId: userData.equipe_id,
          equipeNome: undefined,
          role: userData.role
        };
      }) || [];

      // Carregar equipes
      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes')
        .select('*')
        .order('nome', { ascending: true });

      if (equipesError) {
        console.error('Error loading equipes:', equipesError);
      } else {
        const formattedEquipes: Equipe[] = equipesData?.map(equipe => ({
          id: equipe.id,
          nome: equipe.nome,
          responsavelId: equipe.responsavel_id || '',
          responsavelNome: equipe.responsavel_nome || '',
          corretores: []
        })) || [];
        setEquipes(formattedEquipes);
      }

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
      if (a.status === 'ativo' && b.status === 'inativo') return -1;
      if (a.status === 'inativo' && b.status === 'ativo') return 1;
      return 0;
    });

  const toggleStatus = async (corretorId: string) => {
    const corretor = corretores.find(c => c.id === corretorId);
    if (!corretor) return;
    
    const newStatus = corretor.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', corretorId);

      if (error) {
        toast.error('Erro ao atualizar status do usuário');
        return;
      }

      setCorretores(corretores.map(c =>
        c.id === corretorId
          ? { ...c, status: newStatus }
          : c
      ));

      toast.success(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleCreateCorretor = (corretorData: Partial<Corretor>) => {
    const newCorretor = corretorData as Corretor;
    setCorretores([...corretores, newCorretor]);
    loadData();
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
    <AccessControlWrapper allowCorretor={false}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600 mt-1">
              Gerencie usuários do sistema
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <AccessControlWrapper requireAdmin>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </AccessControlWrapper>
            
            <AccessControlWrapper requireAdmin>
              <Button variant="outline" onClick={() => navigate('/equipes')}>
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Equipes
              </Button>
            </AccessControlWrapper>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <p className="text-sm text-gray-600">Usuários Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {corretores.filter(c => c.status === 'pendente').length}
                  </p>
                  <p className="text-sm text-gray-600">Aguardando Confirmação</p>
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
                  <p className="text-sm text-gray-600">Usuários Inativos</p>
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
                  <p className="text-sm text-gray-600">Total de Usuários</p>
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
                placeholder="Buscar usuários..."
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

        {/* Lista de Usuários */}
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
                    variant={corretor.status === 'ativo' ? 'default' : corretor.status === 'pendente' ? 'secondary' : 'destructive'}
                    className={
                      corretor.status === 'ativo' ? 'bg-green-100 text-green-800' : 
                      corretor.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {corretor.status === 'pendente' ? 'Aguardando confirmação' : corretor.status}
                  </Badge>
                </div>
                <div className="mt-2">
                  <UserRoleBadge />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{corretor.telefone || 'Não informado'}</span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Permissões:</p>
                    <div className="flex flex-wrap gap-1">
                      {corretor.permissoes.slice(0, 2).map((permissao) => (
                        <Badge key={permissao} variant="outline" className="text-xs">
                          {permissao}
                        </Badge>
                      ))}
                      {corretor.permissoes.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{corretor.permissoes.length - 2} mais
                        </Badge>
                      )}
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

                  {corretor.status === 'pendente' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                      <p>Usuário criado mas ainda não confirmou o email.</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    <AccessControlWrapper allowCorretor={false}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditClick(corretor)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </AccessControlWrapper>
                    
                    <AccessControlWrapper requireAdmin>
                      <Button 
                        variant={corretor.status === 'ativo' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleStatus(corretor.id)}
                      >
                        {corretor.status === 'ativo' ? 'Inativar' : 'Ativar'}
                      </Button>
                    </AccessControlWrapper>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AccessControlWrapper requireAdmin>
          <NewCorretorModal
            isOpen={showNewModal}
            onClose={() => setShowNewModal(false)}
            onCreateCorretor={handleCreateCorretor}
          />
        </AccessControlWrapper>

        <AccessControlWrapper allowCorretor={false}>
          <EditCorretorModal
            corretor={selectedCorretor}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCorretor(null);
            }}
            onUpdateCorretor={handleUpdateCorretor}
          />
        </AccessControlWrapper>
      </div>
    </AccessControlWrapper>
  );
};

export default Corretores;
