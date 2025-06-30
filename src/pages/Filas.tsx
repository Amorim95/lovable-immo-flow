import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Fila } from "@/types/crm";
import { 
  Plus,
  Phone,
  Settings
} from "lucide-react";

const mockFilas: Fila[] = [
  {
    id: '1',
    nome: 'Fila Facebook Ads - Apartamentos',
    corretores: ['Maria Santos', 'Pedro Oliveira'],
    ordem: 'sequencial',
    origem: 'meta-ads',
    status: 'ativa',
    configuracoes: {
      tempoResposta: 90,
      maxLeadsPorCorretor: 10
    }
  },
  {
    id: '2',
    nome: 'Fila Google Ads - Casas',
    corretores: ['Pedro Oliveira', 'Ana Costa'],
    ordem: 'sequencial',
    origem: 'google-ads',
    status: 'ativa',
    configuracoes: {
      tempoResposta: 120,
      maxLeadsPorCorretor: 8
    }
  }
];

const Filas = () => {
  const [filas, setFilas] = useState<Fila[]>(mockFilas);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newFila, setNewFila] = useState({
    nome: '',
    corretores: [] as string[],
    ordem: 'sequencial' as 'sequencial' | 'random',
    origem: 'meta-ads' as 'meta-ads' | 'google-ads' | 'indicacao' | 'geral',
    tempoResposta: 90,
    maxLeadsPorCorretor: 10
  });

  const corretoresDisponiveis = ['Maria Santos', 'Pedro Oliveira', 'Ana Costa'];

  const handleCreateFila = () => {
    if (!newFila.nome.trim()) {
      alert('Nome da fila é obrigatório');
      return;
    }

    const fila: Fila = {
      id: Date.now().toString(),
      nome: newFila.nome,
      corretores: newFila.corretores,
      ordem: newFila.ordem,
      origem: newFila.origem,
      status: 'ativa',
      configuracoes: {
        tempoResposta: newFila.tempoResposta,
        maxLeadsPorCorretor: newFila.maxLeadsPorCorretor
      }
    };

    setFilas([...filas, fila]);
    setNewFila({
      nome: '',
      corretores: [],
      ordem: 'sequencial',
      origem: 'meta-ads',
      tempoResposta: 90,
      maxLeadsPorCorretor: 10
    });
    setShowNewModal(false);
  };

  const toggleFilaStatus = (filaId: string) => {
    setFilas(filas.map(fila =>
      fila.id === filaId
        ? { ...fila, status: fila.status === 'ativa' ? 'pausada' : 'ativa' }
        : fila
    ));
  };

  const getOrigemLabel = (origem: string) => {
    const labels = {
      'meta-ads': 'Meta Ads',
      'google-ads': 'Google Ads',
      'indicacao': 'Indicação',
      'geral': 'Geral'
    };
    return labels[origem as keyof typeof labels] || origem;
  };

  const handleCorretorToggle = (corretor: string) => {
    setNewFila(prev => ({
      ...prev,
      corretores: prev.corretores.includes(corretor)
        ? prev.corretores.filter(c => c !== corretor)
        : [...prev.corretores, corretor]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Filas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie filas de atendimento e distribuição de leads
          </p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Fila
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{filas.filter(f => f.status === 'ativa').length}</p>
                <p className="text-sm text-gray-600">Filas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">23</p>
                <p className="text-sm text-gray-600">Leads na Fila</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-sm text-gray-600">Leads Processados Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2.3 min</p>
                <p className="text-sm text-gray-600">Tempo Médio de Resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filas.map((fila) => (
          <Card key={fila.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{fila.nome}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={fila.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {fila.status === 'ativa' ? 'Ativa' : 'Pausada'}
                  </Badge>
                  <Badge variant="outline">{getOrigemLabel(fila.origem)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Corretores na fila:</span>
                  <span className="font-medium">{fila.corretores.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ordem de distribuição:</span>
                  <span className="font-medium">{fila.ordem === 'sequencial' ? 'Sequencial' : 'Aleatória'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tempo de resposta:</span>
                  <span className="font-medium">{fila.configuracoes.tempoResposta}s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Max leads por corretor:</span>
                  <span className="font-medium">{fila.configuracoes.maxLeadsPorCorretor}</span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Corretores:</p>
                  <div className="flex flex-wrap gap-1">
                    {fila.corretores.map((corretor) => (
                      <Badge key={corretor} variant="outline" className="text-xs">
                        {corretor}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="w-3 h-3 mr-1" />
                    Configurar
                  </Button>
                  <Button 
                    variant={fila.status === 'ativa' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleFilaStatus(fila.id)}
                  >
                    {fila.status === 'ativa' ? 'Pausar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Nova Fila */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nova Fila
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Fila</Label>
              <Input
                id="nome"
                value={newFila.nome}
                onChange={(e) => setNewFila({ ...newFila, nome: e.target.value })}
                placeholder="Ex: Fila Meta Ads - Apartamentos"
              />
            </div>

            <div>
              <Label>Origem dos Leads</Label>
              <Select value={newFila.origem} onValueChange={(value: any) => setNewFila({ ...newFila, origem: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta-ads">Meta Ads (Facebook/Instagram)</SelectItem>
                  <SelectItem value="google-ads">Google Ads</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ordem de Distribuição</Label>
              <Select value={newFila.ordem} onValueChange={(value: any) => setNewFila({ ...newFila, ordem: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequencial">Sequencial</SelectItem>
                  <SelectItem value="random">Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Corretores na Fila</Label>
              <div className="space-y-2 mt-2">
                {corretoresDisponiveis.map((corretor) => (
                  <div key={corretor} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={corretor}
                      checked={newFila.corretores.includes(corretor)}
                      onChange={() => handleCorretorToggle(corretor)}
                      className="rounded"
                    />
                    <label htmlFor={corretor} className="text-sm">
                      {corretor}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tempoResposta">Tempo Resposta (s)</Label>
                <Input
                  id="tempoResposta"
                  type="number"
                  value={newFila.tempoResposta}
                  onChange={(e) => setNewFila({ ...newFila, tempoResposta: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maxLeads">Max Leads/Corretor</Label>
                <Input
                  id="maxLeads"
                  type="number"
                  value={newFila.maxLeadsPorCorretor}
                  onChange={(e) => setNewFila({ ...newFila, maxLeadsPorCorretor: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateFila}>
                Criar Fila
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integração Meta Ads */}
      <Card>
        <CardHeader>
          <CardTitle>Integração Meta Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Conectado com Meta Ads</span>
              </div>
              <p className="text-sm text-gray-600">
                Sua conta Meta Ads está conectada e enviando leads automaticamente para as filas configuradas.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Campanhas conectadas:</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Leads recebidos hoje:</span>
                <span className="font-medium">43</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Última sincronização:</span>
                <span className="font-medium">Há 2 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status da API:</span>
                <span className="font-medium text-green-600">Ativa</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm">
                Configurar Webhooks
              </Button>
              <Button variant="outline" size="sm">
                Testar Conexão
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Filas;
