import { ReactNode } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

interface AccessControlCheckProps {
  children: ReactNode;
  feature: 'site' | 'imoveis' | 'dashboards';
  fallbackMessage?: string;
}

export function AccessControlCheck({ 
  children, 
  feature, 
  fallbackMessage 
}: AccessControlCheckProps) {
  const { accessControl, isLoading } = useCompanyAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  const hasAccess = () => {
    switch (feature) {
      case 'site':
        return accessControl.site_enabled;
      case 'imoveis':
        return accessControl.imoveis_enabled;
      case 'dashboards':
        return accessControl.dashboards_enabled;
      default:
        return false;
    }
  };

  if (!hasAccess()) {
    const featureNames = {
      site: 'Site',
      imoveis: 'Imóveis',
      dashboards: 'Dashboards'
    };

    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl text-destructive">
              Acesso Bloqueado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <AlertTriangle className="w-5 h-5" />
              <p>
                {fallbackMessage || 
                  `O acesso ao módulo "${featureNames[feature]}" foi bloqueado para sua empresa.`
                }
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador do sistema para mais informações.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}