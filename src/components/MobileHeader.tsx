import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { NotificationPermissionButton } from "@/components/NotificationPermissionButton";

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
  return <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between dark:bg-white dark:border-gray-200">
      <div className="flex items-center gap-3">
        {showBackButton && <Button variant="ghost" size="sm" onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>}
        {logoOnly ? <div className="flex items-center gap-2">
            <img src="/lovable-uploads/default-crm-logo.png" alt="Logo" className="h-8 w-auto" />
          </div> : <>
            {!showBackButton && settings.logo && <img src={settings.logo} alt={settings.name} className="h-8 w-auto" />}
            {title && <h1 className="text-lg font-semibold text-gray-900 truncate text-center flex-1">
                {title}
              </h1>}
          </>}
      </div>
      
      {rightElement && <div className="flex items-center gap-2">
          <NotificationPermissionButton />
          {rightElement}
        </div>}
      
      {!rightElement && <div className="flex items-center">
          <NotificationPermissionButton />
        </div>}
    </header>;
}