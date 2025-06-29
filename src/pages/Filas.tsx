
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  plus as Plus,
  phone as Phone
} from "lucide-react";

const Filas = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Filas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie filas de atendimento e integração com Meta Ads
          </p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90">
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
                <p className="text-2xl font-bold text-gray-900">4</p>
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Fila Facebook Ads - Apartamentos</CardTitle>
              <Badge className="bg-green-100 text-green-800">Ativa</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Leads na fila:</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Corretores ativos:</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tempo médio de resposta:</span>
                <span className="font-medium">1.5 min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Taxa de conversão:</span>
                <span className="font-medium text-green-600">18.5%</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">Corretores:</p>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">Maria Santos</Badge>
                  <Badge variant="outline" className="text-xs">Pedro Oliveira</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Fila Google Ads - Casas</CardTitle>
              <Badge className="bg-green-100 text-green-800">Ativa</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Leads na fila:</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Corretores ativos:</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tempo médio de resposta:</span>
                <span className="font-medium">2.1 min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Taxa de conversão:</span>
                <span className="font-medium text-green-600">22.1%</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">Corretores:</p>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">Pedro Oliveira</Badge>
                  <Badge variant="outline" className="text-xs">Ana Costa</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Fila Instagram - Primeira Casa</CardTitle>
              <Badge className="bg-yellow-100 text-yellow-800">Pausada</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Leads na fila:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Corretores ativos:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Último processamento:</span>
                <span className="font-medium">Há 2 horas</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Taxa de conversão:</span>
                <span className="font-medium text-green-600">15.8%</span>
              </div>
              <div className="pt-2">
                <Button variant="default" size="sm" className="w-full">
                  Reativar Fila
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Fila Geral - Indicações</CardTitle>
              <Badge className="bg-green-100 text-green-800">Ativa</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Leads na fila:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Corretores ativos:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tempo médio de resposta:</span>
                <span className="font-medium">0.8 min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Taxa de conversão:</span>
                <span className="font-medium text-green-600">35.2%</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">Corretores:</p>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">Maria Santos</Badge>
                  <Badge variant="outline" className="text-xs">Pedro Oliveira</Badge>
                  <Badge variant="outline" className="text-xs">Ana Costa</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuração Meta Ads */}
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
