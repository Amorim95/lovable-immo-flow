import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function MobileHeader({ title, showBackButton, onBack, rightElement }: MobileHeaderProps) {
  const { settings } = useCompany();
  
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {!showBackButton && settings.logo && (
          <img 
            src={settings.logo} 
            alt={settings.name} 
            className="h-8 w-auto"
          />
        )}
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        )}
      </div>
      
      {rightElement && (
        <div className="flex items-center gap-2">
          {rightElement}
        </div>
      )}
    </header>
  );
}