
import { useState, useEffect } from "react";
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
import { AccessControlWrapper } from "@/components/AccessControlWrapper";
import { supabase } from "@/integrations/supabase/client";

import { User, Edit, Settings, Link, Upload, Palette, Moon, Sun, Shield } from "lucide-react";

const Configuracoes = () => {
  const { settings, updateSettings } = useCompany();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(settings.name);
  const [companyLogo, setCompanyLogo] = useState<string | null>(settings.logo);

  // Sincronizar estado local com as configurações quando elas mudarem
  useEffect(() => {
    setCompanyName(settings.name);
    setCompanyLogo(settings.logo);
  }, [settings.name, settings.logo]);

  const themes = [
    { id: 'blue', name: 'Azul', color: '#3B82F6' },
    { id: 'green', name: 'Verde', color: '#10B981' },
    { id: 'purple', name: 'Roxo', color: '#8B5CF6' },
    { id: 'orange', name: 'Laranja', color: '#F59E0B' },
    { id: 'red', name: 'Vermelho', color: '#EF4444' }
  ];

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "A logo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      // Preview local da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para o Supabase Storage
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          throw new Error('Erro ao fazer upload da logo');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-media')
          .getPublicUrl(fileName);

        // Atualizar o estado com a URL pública
        setCompanyLogo(publicUrl);
        
        toast({
          title: "Upload concluído",
          description: "Logo carregada com sucesso!",
        });
      } catch (error) {
        console.error('Erro no upload da logo:', error);
        toast({
          title: "Erro",
          description: "Não foi possível fazer upload da logo. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveCompany = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateSettings({
        name: companyName,
        logo: companyLogo
      });
      
      toast({
        title: "Configurações salvas",
        description: "As configurações da empresa foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações da empresa.",
        variant: "destructive"
      });
    }
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

      <Tabs defaultValue="seguranca" className="w-full">
        <AccessControlWrapper
          allowCorretor={false}
          fallback={
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="seguranca" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Acessos e Segurança
              </TabsTrigger>
            </TabsList>
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Acessos e Segurança
            </TabsTrigger>
          </TabsList>
        </AccessControlWrapper>

        <AccessControlWrapper
          allowCorretor={false}
          fallback={null}
        >
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
        </AccessControlWrapper>

        <TabsContent value="seguranca" className="space-y-6">
          <SecuritySettings />
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default Configuracoes;
