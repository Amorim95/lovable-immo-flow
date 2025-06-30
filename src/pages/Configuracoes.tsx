
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Edit, Settings, Link } from "lucide-react";

const Configuracoes = () => {
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [metaConnected, setMetaConnected] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Configure as preferências do sistema e integrações
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="empresa-nome">Nome da Empresa</Label>
              <Input id="empresa-nome" placeholder="Nome da sua imobiliária" />
            </div>
            <div>
              <Label htmlFor="empresa-cnpj">CNPJ</Label>
              <Input id="empresa-cnpj" placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <Label htmlFor="empresa-endereco">Endereço</Label>
              <Input id="empresa-endereco" placeholder="Endereço completo" />
            </div>
            <div>
              <Label htmlFor="empresa-telefone">Telefone</Label>
              <Input id="empresa-telefone" placeholder="(11) 99999-9999" />  
            </div>
            <div>
              <Label htmlFor="empresa-email">E-mail</Label>
              <Input id="empresa-email" type="email" placeholder="contato@imobiliaria.com" />
            </div>
            <Button className="w-full">Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* Configurações de Acesso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Controle de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Permissões Disponíveis:</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Visualizar Leads</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Editar Leads</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Acessar Dashboards</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Gerenciar Corretores</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Configurar Filas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Configurações Gerais</span>
                </label>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Níveis de Acesso:</h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium">Administrador</div>
                  <div className="text-gray-600">Acesso total ao sistema</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium">Corretor Senior</div>
                  <div className="text-gray-600">Leads, dashboards e filas</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium">Corretor</div>
                  <div className="text-gray-600">Apenas leads</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Notificações */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">E-mail:</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Novos leads</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Leads sem resposta</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Relatórios diários</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Vendas fechadas</span>
                </label>
              </div>
            </div>
            <Button className="w-full">Salvar Preferências</Button>
          </CardContent>
        </Card>

        {/* Integrações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Meta Ads (Facebook/Instagram)</div>
                    <div className="text-sm text-gray-500">Integração com Facebook e Instagram Ads</div>
                    {metaConnected && (
                      <Badge className="bg-green-100 text-green-800 text-xs mt-1">Conectado</Badge>
                    )}
                  </div>
                </div>
                <Button 
                  variant={metaConnected ? "outline" : "default"} 
                  size="sm"
                  onClick={() => setShowMetaModal(true)}
                >
                  {metaConnected ? 'Configurar' : 'Conectar'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium">Google Ads</div>
                    <div className="text-sm text-gray-500">Integração com Google Ads para captura de leads</div>
                    {googleConnected && (
                      <Badge className="bg-green-100 text-green-800 text-xs mt-1">Conectado</Badge>
                    )}
                  </div>
                </div>
                <Button 
                  variant={googleConnected ? "outline" : "default"} 
                  size="sm"
                  onClick={() => setShowGoogleModal(true)}
                >
                  {googleConnected ? 'Configurar' : 'Conectar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Meta Ads */}
      <Dialog open={showMetaModal} onOpenChange={setShowMetaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Meta Ads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>App ID</Label>
              <Input placeholder="Digite seu App ID do Facebook" />
            </div>
            <div>
              <Label>App Secret</Label>
              <Input type="password" placeholder="Digite seu App Secret" />
            </div>
            <div>
              <Label>Access Token</Label>
              <Input placeholder="Cole seu Access Token" />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Após conectar, seus leads do Facebook e Instagram serão automaticamente importados para o sistema.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMetaModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                setMetaConnected(true);
                setShowMetaModal(false);
              }}>
                Conectar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Google Ads */}
      <Dialog open={showGoogleModal} onOpenChange={setShowGoogleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Google Ads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer ID</Label>
              <Input placeholder="Digite seu Customer ID do Google Ads" />
            </div>
            <div>
              <Label>Developer Token</Label>
              <Input type="password" placeholder="Digite seu Developer Token" />
            </div>
            <div>
              <Label>Client ID</Label>
              <Input placeholder="Digite seu Client ID" />
            </div>
            <div>
              <Label>Client Secret</Label>
              <Input type="password" placeholder="Digite seu Client Secret" />
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                Após conectar, os leads das suas campanhas do Google Ads serão importados automaticamente.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGoogleModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                setGoogleConnected(true);
                setShowGoogleModal(false);
              }}>
                Conectar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes;
