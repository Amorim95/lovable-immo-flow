import { useState } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useLeadStages } from "@/hooks/useLeadStages";
import { cn } from "@/lib/utils";

interface MultiStageFilterProps {
  selectedStageNames: string[];
  onStageChange: (stageNames: string[]) => void;
  className?: string;
}

// Etapas padrão (legacy) como fallback
const defaultStages = [
  { key: 'aguardando-atendimento', nome: 'Aguardando Atendimento', cor: '#3B82F6' },
  { key: 'tentativas-contato', nome: 'Tentativas de Contato', cor: '#F59E0B' },
  { key: 'atendeu', nome: 'Atendeu', cor: '#8B5CF6' },
  { key: 'nome-sujo', nome: 'Nome Sujo', cor: '#EF4444' },
  { key: 'nome-limpo', nome: 'Nome Limpo', cor: '#10B981' },
  { key: 'visita', nome: 'Visita', cor: '#EC4899' },
  { key: 'vendas-fechadas', nome: 'Vendas Fechadas', cor: '#22C55E' },
  { key: 'em-pausa', nome: 'Em Pausa', cor: '#6B7280' },
  { key: 'descarte', nome: 'Descarte', cor: '#DC2626' },
];

export function MultiStageFilter({ selectedStageNames, onStageChange, className }: MultiStageFilterProps) {
  const [open, setOpen] = useState(false);
  const { stages, loading } = useLeadStages();

  // Usar etapas customizadas se disponíveis, caso contrário usar as padrão
  const availableStages = stages.length > 0 
    ? stages.map(stage => ({
        nome: stage.nome,
        cor: stage.cor
      }))
    : defaultStages;

  const selectedStages = availableStages.filter(stage => selectedStageNames.includes(stage.nome));

  const handleToggleStage = (stageName: string) => {
    const newSelection = selectedStageNames.includes(stageName)
      ? selectedStageNames.filter(name => name !== stageName)
      : [...selectedStageNames, stageName];
    
    onStageChange(newSelection);
  };

  const clearSelection = () => {
    onStageChange([]);
  };

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <Button variant="outline" disabled className="w-full justify-start">
          <Filter className="mr-2 h-4 w-4 animate-spin" />
          Carregando etapas...
        </Button>
      </div>
    );
  }

  if (!loading && availableStages.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <Button variant="outline" disabled className="w-full justify-start">
          <Filter className="mr-2 h-4 w-4" />
          Nenhuma etapa disponível
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
          >
            <Filter className="mr-2 h-4 w-4" />
            {selectedStages.length === 0 
              ? "Selecionar etapas" 
              : `${selectedStages.length} etapa${selectedStages.length > 1 ? 's' : ''} selecionada${selectedStages.length > 1 ? 's' : ''}`
            }
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar etapas..." />
            <CommandList>
              <CommandEmpty>Nenhuma etapa encontrada.</CommandEmpty>
              <CommandGroup>
                {availableStages.map((stage) => (
                  <CommandItem
                    key={stage.nome}
                    value={stage.nome}
                    onSelect={() => handleToggleStage(stage.nome)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedStageNames.includes(stage.nome) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.cor }}
                      />
                      {stage.nome}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected stages display */}
      {selectedStages.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedStages.map((stage) => (
            <Badge 
              key={stage.nome} 
              variant="secondary" 
              className="text-xs"
              style={{ backgroundColor: `${stage.cor}20`, borderColor: stage.cor }}
            >
              <div 
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: stage.cor }}
              />
              {stage.nome}
              <button
                onClick={() => handleToggleStage(stage.nome)}
                className="ml-1 hover:bg-black/20 rounded-full w-3 h-3 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs"
            onClick={clearSelection}
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
