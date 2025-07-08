
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { SecuritySettings } from "@/components/SecuritySettings";
import { User, Edit, Settings, Link, Upload, Palette, Moon, Sun, Shield } from "lucide-react";

const Configuracoes = () => {
  const { settings, updateSettings } = useCompany();
  const { toast } = useToast();
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [metaConnected, setMetaConnected] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [companyName, setCompanyName] = useState(settings.name);
  const [companyLogo, setCompanyLogo] = useState<string | null>(settings.logo);

  const themes = [
    { id: 'blue', name: 'Azul', color: '#3B82F6' },
    { id: 'green', name: 'Verde', color: '#10B981' },
    { id: 'purple', name: 'Roxo', color: '#8B5CF6' },
    { id: 'orange', name: 'Laranja', color: '#F59E0B' },
    { id: 'red', name: 'Vermelho', color: '#EF4444' }
  ];

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = () => {
    updateSettings({
      name: companyName,
      logo: companyLogo
    });
    toast({
      title: "Configurações salvas",
      description: "As configurações da empresa foram atualizadas com sucesso.",
    });
  };

  const handleSaveTheme = () => {
    toast({
      title: "Tema salvo",
      description: "As configurações de tema foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Configure as preferências do sistema e integrações
        </p>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Acessos e Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-6">
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
                <Input 
                  id="empresa-nome" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da sua imobiliária" 
                />
              </div>
              <div>
                <Label htmlFor="empresa-logo">Logo da Empresa</Label>
                <div className="mt-2">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="empresa-logo"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('empresa-logo')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Coloque aqui sua logo
                    </Button>
                    {companyLogo && (
                      <div className="w-16 h-16 border rounded-lg overflow-hidden">
                        <img 
                          src={companyLogo} 
                          alt="Logo da empresa" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleSaveCompany}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-6">
          <SecuritySettings />
        </TabsContent>
      </Tabs>

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
