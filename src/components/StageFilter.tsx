import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLeadStages } from "@/hooks/useLeadStages";
import { cn } from "@/lib/utils";

interface StageFilterProps {
  selectedStageKey: string | null;
  onStageChange: (stageKey: string | null) => void;
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

export function StageFilter({ selectedStageKey, onStageChange, className }: StageFilterProps) {
  const { stages, loading } = useLeadStages();

  // Usar etapas customizadas se disponíveis, caso contrário usar as padrão
  const availableStages = stages.length > 0 
    ? stages.map(stage => ({
        key: stage.legacy_key || stage.nome,
        nome: stage.nome,
        cor: stage.cor
      }))
    : defaultStages;

  const selectedStage = availableStages.find(stage => stage.key === selectedStageKey);

  const handleStageChange = (value: string) => {
    if (value === 'all') {
      onStageChange(null);
    } else {
      onStageChange(value);
    }
  };

  const clearSelection = () => {
    onStageChange(null);
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
    <div className={cn("flex flex-col gap-2", className)}>
      <Select value={selectedStageKey || 'all'} onValueChange={handleStageChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Todas as Etapas" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              Todas as Etapas
            </div>
          </SelectItem>
          {availableStages.map((stage) => (
            <SelectItem key={stage.key} value={stage.key}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: stage.cor }}
                />
                {stage.nome}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Selected stage badge */}
      {selectedStage && (
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="text-xs flex items-center gap-1"
            style={{ backgroundColor: `${selectedStage.cor}20`, borderColor: selectedStage.cor }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedStage.cor }}
            />
            {selectedStage.nome}
            <button
              onClick={clearSelection}
              className="ml-1 hover:bg-black/20 rounded-full w-3 h-3 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}
