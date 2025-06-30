
import { useState } from "react";
import { Corretor } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NewCorretorModal } from "@/components/NewCorretorModal";
import { EditCorretorModal } from "@/components/EditCorretorModal";
import { 
  Plus,
  User,
  Phone,
  Edit
} from "lucide-react";

const mockCorretores: Corretor[] = [
  {
    id: '1',
    numero: '001',
    nome: 'Maria Santos',
    email: 'maria@imobiliaria.com',
    telefone: '(11) 99999-9999',
    status: 'ativo',
    permissoes: ['leads', 'dashboards', 'imoveis'],
    leads: ['1', '3', '5']
  },
  {
    id: '2',
    numero: '002',
    nome: 'Pedro Oliveira',
    email: 'pedro@imobiliaria.com',
    telefone: '(11) 88888-8888',
    status: 'ativo',
    permissoes: ['leads', 'imoveis'],
    leads: ['2', '4', '6']
  },
  {
    id: '3',
    numero: '003',
    nome: 'Ana Costa',
    email: 'ana@imobiliaria.com',
    telefone: '(11) 77777-7777',
    status: 'inativo',
    permissoes: ['leads'],
    leads: []
  }
];

const Corretores = () => {
  const [corretores, setCorretores] = useState<Corretor[]>(mockCorretores);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);

  const filteredCorretores = corretores.filter(corretor =>
    corretor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corretor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corretor.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (corretorId: string) => {
    setCorretores(corretores.map(corretor =>
      corretor.id === corretorId
        ? { ...corretor, status: corretor.status === 'ativo' ? 'inativo' : 'ativo' }
        : corretor
    ));
  };

  const handleCreateCorretor = (corretorData: Partial<Corretor>) => {
    const newCorretor = corretorData as Corretor;
    setCorretores([...corretores, newCorretor]);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Corretores</h1>
          <p className="text-gray-600 mt-1">
            Gerencie sua equipe de corretores e suas permissões
          </p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Corretor
        </Button>
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
                    <p className="text-sm text-gray-600">#{corretor.numero}</p>
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
      />

      <EditCorretorModal
        corretor={selectedCorretor}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCorretor(null);
        }}
        onUpdateCorretor={handleUpdateCorretor}
      />
    </div>
  );
};

export default Corretores;
