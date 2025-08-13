import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Globe, CheckCircle, AlertCircle, Clock } from "lucide-react";

export function DomainSettings() {
  const [customDomain, setCustomDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { settings, updateSettings, refreshSettings } = useCompany();
  const { toast } = useToast();

  useEffect(() => {
    if (settings.custom_domain) {
      setCustomDomain(settings.custom_domain);
    }
  }, [settings]);

  const handleSaveDomain = async () => {
    if (!customDomain.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um domínio válido",
        variant: "destructive",
      });
      return;
    }

    // Validação básica de domínio
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(customDomain)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um domínio válido (ex: www.minhaempresa.com)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateSettings({
        custom_domain: customDomain.toLowerCase(),
        domain_status: "pendente",
        ssl_status: "pendente",
      });

      toast({
        title: "Domínio salvo",
        description: "Agora configure o DNS conforme as instruções abaixo",
      });
    } catch (error) {
      console.error("Erro ao salvar domínio:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar domínio personalizado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!settings.custom_domain) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { domain: settings.custom_domain },
      });

      if (error) throw error;

      if (data.verified) {
        await updateSettings({
          domain_status: "ativo",
          domain_verified_at: new Date().toISOString(),
        });
        
        toast({
          title: "Domínio verificado",
          description: "Seu domínio personalizado está ativo!",
        });
      } else {
        toast({
          title: "Domínio não verificado",
          description: "Verifique se o DNS foi configurado corretamente",
          variant: "destructive",
        });
      }

      await refreshSettings();
    } catch (error) {
      console.error("Erro ao verificar domínio:", error);
      toast({
        title: "Erro na verificação",
        description: "Erro ao verificar o domínio",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case "erro":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const currentDomain = window.location.hostname;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Domínio Personalizado
        </CardTitle>
        <CardDescription>
          Configure um domínio personalizado para o site público da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Domínio Personalizado</label>
          <div className="flex gap-2">
            <Input
              placeholder="www.minhaempresa.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={handleSaveDomain} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        {settings.custom_domain && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status do Domínio</p>
                <p className="text-sm text-muted-foreground">{settings.custom_domain}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(settings.domain_status || "pendente")}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyDomain}
                  disabled={isVerifying || settings.domain_status === "ativo"}
                >
                  {isVerifying ? "Verificando..." : "Verificar"}
                </Button>
              </div>
            </div>

            {settings.domain_status !== "ativo" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Configuração DNS necessária:</p>
                    <div className="font-mono text-xs bg-muted p-2 rounded">
                      <p>Tipo: CNAME</p>
                      <p>Nome: www (ou @)</p>
                      <p>Valor: {currentDomain}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Configure estes registros DNS no seu provedor de domínio (GoDaddy, Registro.br, etc.) 
                      e clique em "Verificar" após a propagação (pode levar até 48h).
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {settings.domain_status === "ativo" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <p className="font-semibold">Domínio ativo!</p>
                  <p>Seu site público está disponível em: <a href={`https://${settings.custom_domain}`} target="_blank" rel="noopener noreferrer" className="underline">{settings.custom_domain}</a></p>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}