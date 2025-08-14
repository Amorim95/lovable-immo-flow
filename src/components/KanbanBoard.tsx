import { useState } from "react";
import { Lead, LeadStage } from "@/types/crm";
import { LeadCard } from "./LeadCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const stageConfig = {
  'aguardando-atendimento': {
    title: 'Aguardando Atendimento',
    color: 'bg-slate-100 border-slate-200',
    headerColor: 'bg-slate-500'
  },
  'tentativas-contato': {
    title: 'Em Tentativas de Contato',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-500'
  },
  'atendeu': {
    title: 'Atendeu',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-500'
  },
  'nome-sujo': {
    title: 'Nome Sujo',
    color: 'bg-amber-50 border-amber-200',
    headerColor: 'bg-amber-500'
  },
  'nome-limpo': {
    title: 'Nome Limpo',
    color: 'bg-teal-50 border-teal-200',
    headerColor: 'bg-teal-500'
  },
  'visita': {
    title: 'Visita',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'bg-purple-500'
  },
  'vendas-fechadas': {
    title: 'Vendas Fechadas',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-500'
  },
  'em-pausa': {
    title: 'Em Pausa',
    color: 'bg-orange-50 border-orange-200',
    headerColor: 'bg-orange-500'
  },
  'descarte': {
    title: 'Descarte',
    color: 'bg-red-50 border-red-200',
    headerColor: 'bg-red-500'
  }
};

interface KanbanBoardProps {
  leads: (Lead & { userId?: string })[];
  onLeadUpdate: (leadId: string, updates: Partial<Lead>) => void;
  onLeadClick: (lead: Lead) => void;
  onCreateLead?: (stage: LeadStage) => void; // Nova prop para criar lead em etapa específica
  onOptimisticUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

export function KanbanBoard({ leads, onLeadUpdate, onLeadClick, onCreateLead, onOptimisticUpdate }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('application/json', JSON.stringify(lead));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    
    try {
      const leadData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (leadData && leadData.etapa !== targetStage) {
        onLeadUpdate(leadData.id, { etapa: targetStage });
      }
    } catch (error) {
      console.error('Erro no drag and drop:', error);
    }
    
    setDraggedLead(null);
  };

  const getLeadsByStage = (stage: LeadStage) => {
    return leads.filter(lead => lead.etapa === stage);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
      {Object.entries(stageConfig).map(([stage, config]) => {
        const stageLeads = getLeadsByStage(stage as LeadStage);
        
        return (
          <div
            key={stage}
            className={`kanban-column min-w-80 ${config.color} border-2 rounded-xl p-4`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage as LeadStage)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${config.headerColor}`} />
                <h3 className="font-semibold text-gray-800">{config.title}</h3>
                <span className="bg-white text-gray-600 text-sm px-2 py-1 rounded-full font-medium">
                  {stageLeads.length}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onCreateLead?.(stage as LeadStage)}
                title={`Adicionar lead em ${config.title}`}
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
