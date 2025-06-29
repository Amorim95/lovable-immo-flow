import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Edit } from "lucide-react";

const Configuracoes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Configure as preferências do sistema e permissões
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
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Cadastrar Imóveis</span>
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
                  <div className="text-gray-600">Leads, dashboards e imóveis</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium">Corretor</div>
                  <div className="text-gray-600">Apenas leads e imóveis</div>
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
            <Separator />
            <div>
              <h4 className="font-medium mb-3">WhatsApp:</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Leads urgentes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Metas atingidas</span>
                </label>
              </div>
            </div>
            <Button className="w-full">Salvar Preferências</Button>
          </CardContent>
        </Card>

        {/* Integrações */}
        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Meta Ads (Facebook/Instagram)</div>
                  <div className="text-sm text-green-600">Conectado</div>
                </div>
                <Button variant="outline" size="sm">Configurar</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Google Ads</div>
                  <div className="text-sm text-gray-500">Não conectado</div>
                </div>
                <Button variant="outline" size="sm">Conectar</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">WhatsApp Business</div>
                  <div className="text-sm text-green-600">Conectado</div>
                </div>
                <Button variant="outline" size="sm">Configurar</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Zapier</div>
                  <div className="text-sm text-gray-500">Não conectado</div>
                </div>
                <Button variant="outline" size="sm">Conectar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracoes;
