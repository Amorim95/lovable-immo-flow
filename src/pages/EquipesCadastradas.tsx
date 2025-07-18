import { useState, useEffect } from "react";
import { Equipe, Corretor } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewTeamModal } from "@/components/NewTeamModal";
import { EditTeamModal } from "@/components/EditTeamModal";
import { 
  Plus,
  Users,
  Settings,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Dados serão carregados do banco de dados

const EquipesCadastradas = () => {
  const navigate = useNavigate();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [corretores, setCorretores] = useState<Corretor[]>([]);
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
        .select('*')
        .order('nome');

      if (equipesError) {
        console.error('Error loading equipes:', equipesError);
        toast.error('Erro ao carregar equipes');
        return;
      }

      // Carregar todos os usuários ativos
      const { data: corretoresData, error: corretoresError } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'ativo')
        .order('name');

      if (corretoresError) {
        console.error('Error loading corretores:', corretoresError);
        toast.error('Erro ao carregar corretores');
        return;
      }

      // Transformar dados
      const equipesFormatted = (equipesData || []).map(equipe => ({
        id: equipe.id,
        nome: equipe.nome,
        responsavelId: equipe.responsavel_id,
        responsavelNome: equipe.responsavel_nome,
        corretores: corretoresData?.filter(c => c.equipe_id === equipe.id).map(c => c.id) || []
      }));

      const corretoresFormatted = (corretoresData || []).map(corretor => ({
        id: corretor.id,
        nome: corretor.name,
        email: corretor.email,
        telefone: corretor.telefone || '',
        status: corretor.status as 'ativo' | 'inativo' | 'pendente',
        permissoes: [], // Will be loaded if needed
        leads: [], // Will be loaded if needed
        equipeId: corretor.equipe_id,
        equipeNome: equipesFormatted.find(e => e.id === corretor.equipe_id)?.nome,
        role: corretor.role as 'admin' | 'gestor' | 'corretor'
      }));

      setEquipes(equipesFormatted);
      setCorretores(corretoresFormatted);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Equipe | null>(null);

  const filteredEquipes = equipes.filter(equipe =>
    equipe.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipe.responsavelNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTeam = (teamData: Partial<Equipe>) => {
    const newTeam = teamData as Equipe;
    setEquipes([...equipes, newTeam]);
  };

  const handleUpdateTeam = (equipeId: string, updates: Partial<Equipe>) => {
    setEquipes(equipes.map(equipe =>
      equipe.id === equipeId ? { ...equipe, ...updates } : equipe
    ));
  };

  const handleDeleteTeam = (equipeId: string) => {
    setEquipes(equipes.filter(equipe => equipe.id !== equipeId));
  };

  const handleEditTeamClick = (equipe: Equipe) => {
    setSelectedTeam(equipe);
    setShowEditTeamModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/corretores')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Corretores
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Equipes Cadastradas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as equipes de corretores da sua imobiliária
          </p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowNewTeamModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{equipes.length}</p>
                <p className="text-sm text-gray-600">Total de Equipes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {equipes.reduce((total, equipe) => total + equipe.corretores.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Corretores em Equipes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(equipes.reduce((total, equipe) => total + equipe.corretores.length, 0) / (equipes.length || 1))}
                </p>
                <p className="text-sm text-gray-600">Média por Equipe</p>
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
              placeholder="Buscar equipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Equipes */}
      {filteredEquipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipes.map((equipe) => (
            <Card key={equipe.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{equipe.nome}</CardTitle>
                      <p className="text-sm text-gray-600">Equipe</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTeamClick(equipe)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Responsável:</p>
                    <p className="text-sm text-gray-600">{equipe.responsavelNome}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Corretores:</p>
                    <p className="text-sm text-gray-600">{equipe.corretores.length} corretor(es)</p>
                  </div>

                  <div className="pt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleEditTeamClick(equipe)}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Gerenciar Equipe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira equipe de corretores'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowNewTeamModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Equipe
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <NewTeamModal
        isOpen={showNewTeamModal}
        onClose={() => setShowNewTeamModal(false)}
        onCreateTeam={handleCreateTeam}
        corretores={corretores}
      />

      <EditTeamModal
        equipe={selectedTeam}
        isOpen={showEditTeamModal}
        onClose={() => {
          setShowEditTeamModal(false);
          setSelectedTeam(null);
        }}
        onUpdateTeam={handleUpdateTeam}
        onDeleteTeam={handleDeleteTeam}
        corretores={corretores}
      />
    </div>
  );
};

export default EquipesCadastradas;