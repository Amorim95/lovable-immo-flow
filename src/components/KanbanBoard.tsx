import { useState } from "react";
import { Lead, LeadStage } from "@/types/crm";
import { LeadCard } from "./LeadCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLeadStages } from "@/hooks/useLeadStages";

// Função para converter hex para cores Tailwind
const getColorClasses = (hexColor: string) => {
  // Converte hex para HSL e gera classes de cor
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  // Gera classes baseadas na luminosidade
  const isLight = l > 0.5;
  
  return {
    color: `border-2 border-gray-200 bg-gray-50`,
    headerColor: hexColor
  };
};

interface KanbanBoardProps {
  leads: (Lead & { userId?: string })[];
  onLeadUpdate: (leadId: string, updates: Partial<Lead>) => void;
  onLeadClick: (lead: Lead) => void;
  onCreateLead?: (stageName: string) => void; // Agora recebe nome da etapa customizada
  onOptimisticUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

export function KanbanBoard({ leads, onLeadUpdate, onLeadClick, onCreateLead, onOptimisticUpdate }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const { stages, loading } = useLeadStages();

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('application/json', JSON.stringify(lead));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStageName: string) => {
    e.preventDefault();
    
    try {
      const leadData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (leadData && leadData.stage_name !== targetStageName) {
        onLeadUpdate(leadData.id, { stage_name: targetStageName });
      }
    } catch (error) {
      console.error('Erro no drag and drop:', error);
    }
    
    setDraggedLead(null);
  };

  const getLeadsByStage = (stageName: string) => {
    const currentStage = stages.find(s => s.nome === stageName);
    
    return leads.filter((lead) => {
      // Prioridade 1: Correspondência EXATA com nome customizado
      if (lead.stage_name === stageName) {
        return true;
      }
      
      // Prioridade 2: Correspondência com legacy_key (apenas se não bateu no nome)
      if (currentStage?.legacy_key && lead.stage_name === currentStage.legacy_key) {
        // ⚠️ GARANTIR que esse lead não pertence a OUTRA etapa
        const belongsToOtherStage = stages.some(s => 
          s.id !== currentStage.id && (
            s.nome === lead.stage_name ||           // Bate com nome customizado de outra etapa
            s.legacy_key === lead.stage_name        // Bate com legacy_key de outra etapa
          )
        );
        if (!belongsToOtherStage) {
          return true;
        }
      }
      
      // Prioridade 3: Fallback para etapa (apenas se stage_name vazio ou null)
      if ((!lead.stage_name || lead.stage_name === '') && 
          currentStage?.legacy_key && 
          lead.etapa === currentStage.legacy_key) {
        return true;
      }
      
      // Fallback compatibilidade com mapeamento antigo
      const oldMapping = getOldStageMapping(stageName);
      return oldMapping && lead.etapa === oldMapping;
    });
  };

  // Mapear apenas nomes antigos conhecidos para manter compatibilidade
  const getOldStageMapping = (stageName: string): LeadStage | null => {
    const mappings: Record<string, LeadStage> = {
      'Aguardando Atendimento': 'aguardando-atendimento',
      'Em Tentativas de Contato': 'tentativas-contato',
      'Atendeu': 'atendeu',
      'Nome Sujo': 'nome-sujo',
      'Nome Limpo': 'nome-limpo',
      'Visita': 'visita',
      'Vendas Fechadas': 'vendas-fechadas',
      'Em Pausa': 'em-pausa',
      'Descarte': 'descarte',
    };
    return mappings[stageName] ?? null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando etapas...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.nome);
        const colorClasses = getColorClasses(stage.cor);
        
        return (
          <div
            key={stage.id}
            className={`kanban-column min-w-80 ${colorClasses.color} rounded-xl p-4`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.nome)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: colorClasses.headerColor }}
                />
                <h3 className="font-semibold text-gray-800">{stage.nome}</h3>
                <span className="bg-white text-gray-600 text-sm px-2 py-1 rounded-full font-medium">
                  {stageLeads.length}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onCreateLead?.(stage.nome)}
                title={`Adicionar lead em ${stage.nome}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  className="cursor-move"
                >
                  <LeadCard
                    lead={lead}
                    onClick={() => onLeadClick(lead)}
                    onUpdate={(updates) => onLeadUpdate(lead.id, updates)}
                    userId={lead.userId}
                    onOptimisticUpdate={onOptimisticUpdate}
                  />
                </div>
              ))}
              
              {stageLeads.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Nenhum lead nesta etapa</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
