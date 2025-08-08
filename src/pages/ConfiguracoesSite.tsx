import { useState, useEffect } from "react";
import { ArrowLeft, Save, Globe, Upload, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

interface SiteSettings {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
}

export default function ConfiguracoesSite() {
  const navigate = useNavigate();
  const { settings, refreshSettings } = useCompany();
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    title: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
    facebook: "",
    instagram: "",
  });

  useEffect(() => {
    // Carregar configurações existentes do contexto
    setSiteSettings({
      title: settings.site_title || settings.name || "",
      description: settings.site_description || "Encontre o imóvel dos seus sonhos",
      phone: settings.site_phone || "(11) 9999-9999",
      email: settings.site_email || "contato@imobiliaria.com.br",
      address: settings.site_address || "São Paulo, SP",
      whatsapp: settings.site_whatsapp || "5511999999999",
      facebook: settings.site_facebook || "",
      instagram: settings.site_instagram || "",
    });
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Primeiro, buscar todas as configurações existentes para pegar o ID mais recente
      const { data: allSettings } = await supabase
        .from('company_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (allSettings && allSettings.length > 0) {
        // Atualizar o registro mais recente
        const { error } = await supabase
          .from('company_settings')
          .update({
            name: siteSettings.title,
            site_title: siteSettings.title,
            site_description: siteSettings.description,
            site_phone: siteSettings.phone,
            site_email: siteSettings.email,
            site_address: siteSettings.address,
            site_whatsapp: siteSettings.whatsapp,
            site_facebook: siteSettings.facebook,
            site_instagram: siteSettings.instagram,
          })
          .eq('id', allSettings[0].id);

        if (error) throw error;
      } else {
        // Criar nova configuração se não existir nenhuma
        const { error } = await supabase
          .from('company_settings')
          .insert({
            name: siteSettings.title,
            site_title: siteSettings.title,
            site_description: siteSettings.description,
            site_phone: siteSettings.phone,
            site_email: siteSettings.email,
            site_address: siteSettings.address,
            site_whatsapp: siteSettings.whatsapp,
            site_facebook: siteSettings.facebook,
            site_instagram: siteSettings.instagram,
          });

        if (error) throw error;
      }

      await refreshSettings();
      toast.success('Configurações do site atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SiteSettings, value: string) => {
    setSiteSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/meu-site')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Configurações do Site
          </h1>
          <p className="text-muted-foreground">
            Configure as informações que aparecerão no seu site público
          </p>
        </div>
      </div>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título do Site</Label>
              <Input
                id="title"
                value={siteSettings.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Nome da sua imobiliária"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={siteSettings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 9999-9999"
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={siteSettings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contato@imobiliaria.com.br"
              />
            </div>
            
            <div>
              <Label htmlFor="whatsapp">WhatsApp (número completo)</Label>
              <Input
                id="whatsapp"
                value={siteSettings.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="5511999999999"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: código do país + DDD + número
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Descrição do Site</Label>
            <Textarea
              id="description"
              value={siteSettings.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição que aparecerá no site..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={siteSettings.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Endereço completo da empresa"
            />
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={siteSettings.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                placeholder="https://facebook.com/suapagina"
              />
            </div>
            
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={siteSettings.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="https://instagram.com/seuperfil"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {settings.logo ? (
              <div className="flex items-center gap-4">
                <img 
                  src={settings.logo} 
                  alt="Logo atual" 
                  className="h-16 w-auto border rounded"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Alterar Logo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">
                  Sem logo
                </div>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Logo
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Recomendamos uma imagem PNG com fundo transparente, tamanho máximo 2MB
          </p>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => window.open('/site-publico', '_blank')}
        >
          <Globe className="w-4 h-4 mr-2" />
          Visualizar Site
        </Button>
        
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}