import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCompany } from "@/contexts/CompanyContext";
import { Palette, Moon, Sun } from "lucide-react";

export default function MobileApearencia() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCompany();

  const handleDarkModeToggle = (checked: boolean) => {
    updateSettings({ isDarkMode: checked });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 dark:bg-background">
      <MobileHeader 
        title="Aparência" 
        showBackButton 
        onBack={() => navigate('/configuracoes')}
      />

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Preferências de Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  {settings.isDarkMode ? (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div>
                  <Label className="text-base font-medium">Modo Noturno</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ative o tema escuro para reduzir o cansaço visual
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.isDarkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>As barras de navegação permanecem brancas</p>
                <p>no modo escuro para melhor usabilidade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}