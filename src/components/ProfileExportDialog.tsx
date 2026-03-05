import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { LeadParsed } from "@/hooks/useClientProfile";
import { exportToExcel, exportToPDF } from "@/utils/exportHelpers";
import { toast } from "sonner";

interface ProfileExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: LeadParsed[];
  filterLabel: string;
  companyName?: string;
  companyLogo?: string | null;
}

export function ProfileExportDialog({ open, onOpenChange, leads, filterLabel, companyName = 'CRM', companyLogo }: ProfileExportDialogProps) {
  const handleExport = (type: 'excel' | 'pdf') => {
    if (leads.length === 0) {
      toast.error('Nenhum lead para exportar');
      return;
    }

    const exportData = leads.map(l => ({
      nome: l.nome,
      telefone: l.telefone,
      created_at: l.created_at,
      stage_name: l.stage_name || undefined,
      renda: l.income ?? null,
    }));

    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').trim() || 'CRM';
    const filename = `${safeCompanyName} - Perfil Cliente - ${filterLabel.replace(/[^a-zA-Z0-9À-ÿ ]/g, '-')}-${new Date().toISOString().slice(0, 10)}`;

    if (type === 'excel') {
      exportToExcel(exportData, filename);
    } else {
      exportToPDF(exportData, filename, companyName, companyLogo || undefined);
    }

    toast.success(`${leads.length} leads exportados com sucesso!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Leads</DialogTitle>
          <DialogDescription>
            {leads.length} leads encontrados para: <strong>{filterLabel}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Button
            variant="outline"
            className="justify-start gap-3 h-14"
            onClick={() => handleExport('excel')}
          >
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium">Exportar em Excel</p>
              <p className="text-xs text-muted-foreground">Formato .xlsx</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-14"
            onClick={() => handleExport('pdf')}
          >
            <FileText className="w-5 h-5 text-red-500" />
            <div className="text-left">
              <p className="font-medium">Exportar em PDF</p>
              <p className="text-xs text-muted-foreground">Formato .pdf</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
