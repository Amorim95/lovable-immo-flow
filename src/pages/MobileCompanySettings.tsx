import { useState, useEffect } from "react";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/useUserRole";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function MobileCompanySettings() {
  const { isAdmin, isGestor } = useUserRole();
  const { settings, updateSettings, refreshSettings } = useCompany();
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canManageCompany = isAdmin || isGestor;

  useEffect(() => {
    if (canManageCompany) {
      loadCompanySettings();
    }
  }, [canManageCompany]);

  useEffect(() => {
    // Sincronizar com o contexto
    setCompanyName(settings.name);
    setCompanyLogo(settings.logo);
    setLoading(false);
  }, [settings]);

  const loadCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações da empresa:', error);
        return;
      }

      if (data) {
        setCompanyName(data.name || '');
        setCompanyLogo(data.logo || null);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da empresa:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          name: companyName,
          logo: companyLogo
        });

      if (error) {
        throw error;
      }

      // Atualizar o contexto para refletir na tela de login
      await updateSettings({
        name: companyName,
        logo: companyLogo
      });

      toast({
        title: "Dados salvos",
        description: "As informações da empresa foram atualizadas com sucesso."
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

  if (!canManageCompany) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Dados da Empresa" />
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-gray-500">Você não tem permissão para gerenciar dados da empresa.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Dados da Empresa" />
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Dados da Empresa" />

      <div className="p-4 space-y-6">
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div>
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input 
              id="company-name" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da sua imobiliária" 
            />
          </div>
          
          <div>
            <Label htmlFor="company-logo">Logo da Empresa</Label>
            <div className="mt-2">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="company-logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('company-logo')?.click()}
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
        </div>

        <Button onClick={handleSave} className="w-full">
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}