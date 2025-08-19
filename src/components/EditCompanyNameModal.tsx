import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit2, Shield, Globe, Building, BarChart } from "lucide-react";

interface EditCompanyNameModalProps {
  company: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCompanyNameModal({ company, isOpen, onOpenChange, onSuccess }: EditCompanyNameModalProps) {
  const [companyName, setCompanyName] = useState(company.name);
  const [isLoading, setIsLoading] = useState(false);
  const [accessControl, setAccessControl] = useState({
    site_enabled: true,
    imoveis_enabled: true,
    dashboards_enabled: true
  });
  const { toast } = useToast();

  // Carregar controle de acesso quando abrir o modal
  useEffect(() => {
    if (isOpen && company.id) {
      loadAccessControl();
    }
  }, [isOpen, company.id]);

  const loadAccessControl = async () => {
    try {
      const { data, error } = await supabase
        .from('company_access_control')
        .select('site_enabled, imoveis_enabled, dashboards_enabled')
        .eq('company_id', company.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setAccessControl(data);
      }
    } catch (error) {
      console.error('Erro ao carregar controle de acesso:', error);
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

    setIsLoading(true);
    try {
      // Atualizar nome da empresa
      const { error: companyError } = await supabase
        .from("companies")
        .update({ name: companyName })
        .eq("id", company.id);

      if (companyError) throw companyError;

      // Atualizar controle de acesso
      const { error: accessError } = await supabase
        .from('company_access_control')
        .upsert({
          company_id: company.id,
          ...accessControl
        }, {
          onConflict: 'company_id'
        });

      if (accessError) throw accessError;

      toast({
        title: "Empresa atualizada",
        description: "Os dados da empresa foram atualizados com sucesso."
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar os dados da empresa.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            Editar Empresa
          </DialogTitle>
          <DialogDescription>
            Altere o nome e controle de acesso da empresa {company.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Nome da Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input 
              id="company-name" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa" 
            />
          </div>

          <Separator />

          {/* Controle de Acesso */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <Label className="text-base font-medium">Controle de Acesso</Label>
            </div>
            
            <div className="space-y-4">
              {/* Site */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Site</Label>
                    <p className="text-xs text-muted-foreground">Acesso ao módulo de site público</p>
                  </div>
                </div>
                <Switch
                  checked={accessControl.site_enabled}
                  onCheckedChange={(checked) => 
                    setAccessControl(prev => ({ ...prev, site_enabled: checked }))
                  }
                />
              </div>

              {/* Imóveis */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Imóveis</Label>
                    <p className="text-xs text-muted-foreground">Acesso ao módulo de imóveis</p>
                  </div>
                </div>
                <Switch
                  checked={accessControl.imoveis_enabled}
                  onCheckedChange={(checked) => 
                    setAccessControl(prev => ({ ...prev, imoveis_enabled: checked }))
                  }
                />
              </div>

              {/* Dashboards */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Dashboards</Label>
                    <p className="text-xs text-muted-foreground">Acesso aos relatórios e dashboards</p>
                  </div>
                </div>
                <Switch
                  checked={accessControl.dashboards_enabled}
                  onCheckedChange={(checked) => 
                    setAccessControl(prev => ({ ...prev, dashboards_enabled: checked }))
                  }
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}