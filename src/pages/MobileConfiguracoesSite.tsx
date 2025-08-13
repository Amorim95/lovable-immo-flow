import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MobileHeader } from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export default function MobileConfiguracoesSite() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCompany();
  const [loading, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  
  const [formData, setFormData] = useState({
    site_title: "",
    site_phone: "",
    site_email: "",
    site_address: "",
    site_about: "",
    site_whatsapp: "",
    site_facebook: "",
    site_instagram: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        site_title: settings.siteTitle || "",
        site_phone: settings.sitePhone || "",
        site_email: settings.siteEmail || "",
        site_address: settings.siteAddress || "",
        site_about: settings.siteAbout || "",
        site_whatsapp: settings.siteWhatsapp || "",
        site_facebook: settings.siteFacebook || "",
        site_instagram: settings.siteInstagram || "",
      });
      setLogoPreview(settings.logo || "");
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) throw new Error("Usuário não autenticado");

      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/logo/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload da logo:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let logoUrl = settings?.logo;

      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      const updatedData = {
        ...formData,
        logo: logoUrl,
        name: formData.site_title,
      };

      await updateSettings(updatedData);

      toast({
        title: "Sucesso",
        description: "Configurações do site atualizadas com sucesso!",
      });

      navigate('/meu-site');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
  };

  return (
    <>
      <MobileHeader 
        title="Config. Site" 
        showBackButton 
        onBack={() => navigate('/meu-site')}
      />
      
      <div className="p-4 space-y-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Logo da Imobiliária</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logoPreview && (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-16 w-auto object-contain rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center w-full h-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Upload className="w-4 h-4" />
                      <span>Escolher logo</span>
                    </div>
                  </div>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Informações básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações da Imobiliária</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="site_title" className="text-sm">Nome da Imobiliária</Label>
                <Input
                  id="site_title"
                  value={formData.site_title}
                  onChange={(e) => handleInputChange('site_title', e.target.value)}
                  placeholder="Digite o nome da imobiliária"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="site_phone" className="text-sm">Telefone</Label>
                <Input
                  id="site_phone"
                  value={formData.site_phone}
                  onChange={(e) => handleInputChange('site_phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="site_email" className="text-sm">E-mail</Label>
                <Input
                  id="site_email"
                  type="email"
                  value={formData.site_email}
                  onChange={(e) => handleInputChange('site_email', e.target.value)}
                  placeholder="contato@imobiliaria.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="site_address" className="text-sm">Endereço</Label>
                <Input
                  id="site_address"
                  value={formData.site_address}
                  onChange={(e) => handleInputChange('site_address', e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sobre nós */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sobre a Imobiliária</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="site_about" className="text-sm">Descrição</Label>
                <Textarea
                  id="site_about"
                  value={formData.site_about}
                  onChange={(e) => handleInputChange('site_about', e.target.value)}
                  placeholder="Conte um pouco sobre a história e diferenciais da sua imobiliária..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Redes Sociais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="site_whatsapp" className="text-sm">WhatsApp</Label>
                <Input
                  id="site_whatsapp"
                  value={formData.site_whatsapp}
                  onChange={(e) => handleInputChange('site_whatsapp', e.target.value)}
                  placeholder="5511999999999"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="site_facebook" className="text-sm">Facebook</Label>
                <Input
                  id="site_facebook"
                  value={formData.site_facebook}
                  onChange={(e) => handleInputChange('site_facebook', e.target.value)}
                  placeholder="https://facebook.com/suapagina"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="site_instagram" className="text-sm">Instagram</Label>
                <Input
                  id="site_instagram"
                  value={formData.site_instagram}
                  onChange={(e) => handleInputChange('site_instagram', e.target.value)}
                  placeholder="https://instagram.com/seuperfil"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão salvar */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}