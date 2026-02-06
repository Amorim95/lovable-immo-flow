import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  logoOnly?: boolean;
}
export function MobileHeader({
  title,
  showBackButton,
  onBack,
  rightElement,
  logoOnly = false
}: MobileHeaderProps) {
  const {
    settings
  } = useCompany();
  return (
    <header className="bg-card border-b px-4 py-3 flex items-center justify-between">
      {/* Coluna esquerda - Logo/Back button */}
      <div className="flex items-center min-w-[40px]">
        {showBackButton && (
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {logoOnly ? (
          <div className="w-10 h-10 rounded-full bg-background border-2 border-primary/20 overflow-hidden flex items-center justify-center shadow-sm">
            <img src="/lovable-uploads/default-crm-logo.png" alt="Logo" className="h-7 w-auto object-contain" />
          </div>
        ) : (
          !showBackButton && settings.logo && (
            <div className="w-10 h-10 rounded-full bg-background border-2 border-primary/20 overflow-hidden flex items-center justify-center shadow-sm">
              <img src={settings.logo} alt={settings.name} className="h-7 w-auto object-contain" />
            </div>
          )
        )}
      </div>

      {/* Coluna central - Frase centralizada */}
      {title && !logoOnly && (
        <div className="flex-1 flex justify-center">
          <h1 className="text-xs font-medium text-muted-foreground italic leading-tight line-clamp-2 max-w-[200px] text-center">
            {title}
          </h1>
        </div>
      )}

      {/* Coluna direita - Elementos opcionais */}
      <div className="flex items-center min-w-[40px] justify-end gap-2">
        {rightElement}
      </div>
    </header>
  );
}