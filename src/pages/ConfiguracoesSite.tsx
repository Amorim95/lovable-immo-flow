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
import { useRef } from "react";

interface SiteSettings {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  about?: string;
  horario_semana?: string;
  horario_sabado?: string;
  horario_domingo?: string;
  observacoes_horario?: string;
}

export default function ConfiguracoesSite() {
  const navigate = useNavigate();
  const { settings, updateSettings, refreshSettings } = useCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    about: "",
    horario_semana: "",
    horario_sabado: "",
    horario_domingo: "",
    observacoes_horario: "",
  });

  useEffect(() => {
    // Carregar configurações existentes do contexto
    setSiteSettings({
      title: settings.site_title || settings.name || "",
      description: settings.site_description || "",
      phone: settings.site_phone || "",
      email: settings.site_email || "",
      address: settings.site_address || "",
      whatsapp: settings.site_whatsapp || "",
      facebook: settings.site_facebook || "",
      instagram: settings.site_instagram || "",
      about: settings.site_about || "",
      horario_semana: settings.site_horario_semana || "8:00 às 18:00",
      horario_sabado: settings.site_horario_sabado || "8:00 às 14:00",
      horario_domingo: settings.site_horario_domingo || "Fechado",
      observacoes_horario: settings.site_observacoes_horario || "*Atendimento via WhatsApp 24 horas",
    });
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings({
        name: siteSettings.title,
        site_title: siteSettings.title,
        site_description: siteSettings.description,
        site_phone: siteSettings.phone,
        site_email: siteSettings.email,
        site_address: siteSettings.address,
        site_whatsapp: siteSettings.whatsapp,
        site_facebook: siteSettings.facebook,
        site_instagram: siteSettings.instagram,
        site_about: siteSettings.about,
        site_horario_semana: siteSettings.horario_semana,
        site_horario_sabado: siteSettings.horario_sabado,
        site_horario_domingo: siteSettings.horario_domingo,
        site_observacoes_horario: siteSettings.observacoes_horario,
      });

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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    console.log('Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      console.log('Tipo de arquivo inválido:', file.type);
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.log('Arquivo muito grande:', file.size);
      toast.error('A imagem deve ter no máximo 2MB.');
      return;
    }

    setLoading(true);
    console.log('Iniciando upload...');
    
    try {
      // Fazer upload para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      console.log('Nome do arquivo gerado:', fileName);
      console.log('Fazendo upload para bucket property-media...');
      
      const { data, error } = await supabase.storage
        .from('property-media')
        .upload(fileName, file);

      if (error) {
        console.error('Erro no upload do storage:', error);
        throw error;
      }

      console.log('Upload realizado com sucesso:', data);

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('property-media')
        .getPublicUrl(fileName);

      console.log('URL pública gerada:', publicUrl);

      // Atualizar no contexto e no banco, com segurança por company_id
      await updateSettings({ logo: publicUrl });

      await refreshSettings();
      
      console.log('Logo atualizada com sucesso');
      toast.success('Logo atualizada com sucesso! Atualize a página do site público para ver as mudanças.');
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      toast.error('Erro ao fazer upload da logo. Tente novamente.');
    } finally {
      setLoading(false);
      // Limpar o input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateSettings({ logo: null });
      
      // Forçar atualização das configurações
      await refreshSettings();
      
      toast.success('Logo removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo. Tente novamente.');
    }
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

      {/* Sobre a Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre a Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="about">Descrição da Empresa</Label>
            <Textarea
              id="about"
              value={siteSettings.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              placeholder="Conte um pouco sobre sua empresa, história, missão, valores..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Esta descrição aparecerá em uma seção "Sobre Nós" no site público
            </p>
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

      {/* Horário de Atendimento */}
      <Card>
        <CardHeader>
          <CardTitle>Horário de Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="horario_semana">Segunda à Sexta</Label>
              <Input
                id="horario_semana"
                value={siteSettings.horario_semana}
                onChange={(e) => handleInputChange('horario_semana', e.target.value)}
                placeholder="8:00 às 18:00"
              />
            </div>
            
            <div>
              <Label htmlFor="horario_sabado">Sábado</Label>
              <Input
                id="horario_sabado"
                value={siteSettings.horario_sabado}
                onChange={(e) => handleInputChange('horario_sabado', e.target.value)}
                placeholder="8:00 às 14:00"
              />
            </div>
            
            <div>
              <Label htmlFor="horario_domingo">Domingo</Label>
              <Input
                id="horario_domingo"
                value={siteSettings.horario_domingo}
                onChange={(e) => handleInputChange('horario_domingo', e.target.value)}
                placeholder="Fechado"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="observacoes_horario">Observações sobre o Horário</Label>
            <Textarea
              id="observacoes_horario"
              value={siteSettings.observacoes_horario}
              onChange={(e) => handleInputChange('observacoes_horario', e.target.value)}
              placeholder="*Atendimento via WhatsApp 24 horas"
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Informações adicionais sobre horários especiais, feriados, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          
          <div className="flex items-center gap-4">
            {settings.logo ? (
              <div className="flex items-center gap-4">
                <img 
                  src={settings.logo} 
                  alt="Logo atual" 
                  className="h-16 w-auto border rounded"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Alterar Logo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={loading}
                  >
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
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