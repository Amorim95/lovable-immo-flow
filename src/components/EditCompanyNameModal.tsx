import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit2 } from "lucide-react";

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
  const { toast } = useToast();

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
      const { error } = await supabase
        .from("companies")
        .update({ name: companyName })
        .eq("id", company.id);

      if (error) throw error;

      toast({
        title: "Nome atualizado",
        description: "O nome da empresa foi atualizado com sucesso."
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar nome da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o nome da empresa.",
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
            Editar Nome da Empresa
          </DialogTitle>
          <DialogDescription>
            Altere o nome da empresa {company.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input 
              id="company-name" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa" 
            />
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