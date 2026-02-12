import { useState, useMemo, useCallback } from "react";
import { Lead, LeadStage } from "@/types/crm";
import { LeadCard } from "./LeadCard";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import { useLeadStages } from "@/hooks/useLeadStages";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

const LEADS_PER_PAGE = 50;

const getColorClasses = (hexColor: string) => {
  return {
    color: `border border-border`,
    headerColor: hexColor
  };
};

interface KanbanBoardProps {
  leads: (Lead & { userId?: string; stage_order?: number })[];
  onLeadUpdate: (leadId: string, updates: Partial<Lead>) => void;
  onLeadClick: (lead: Lead) => void;
  onCreateLead?: (stageName: string) => void;
  onOptimisticUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

export function KanbanBoard({ leads, onLeadUpdate, onLeadClick, onCreateLead, onOptimisticUpdate }: KanbanBoardProps) {
  const [stageVisibleCounts, setStageVisibleCounts] = useState<Record<string, number>>({});
  const { stages, loading } = useLeadStages();

  const getVisibleCount = (stageName: string) => {
    return stageVisibleCounts[stageName] || LEADS_PER_PAGE;
  };

  const handleShowMore = (stageName: string) => {
    setStageVisibleCounts(prev => ({
      ...prev,
      [stageName]: (prev[stageName] || LEADS_PER_PAGE) + LEADS_PER_PAGE
    }));
  };

  const getLeadsByStage = useCallback((stageName: string) => {
    const currentStage = stages.find(s => s.nome === stageName);
    
    const filtered = leads.filter((lead) => {
      if (lead.stage_name === stageName) return true;
      
      if (currentStage?.legacy_key && lead.stage_name === currentStage.legacy_key) {
        const belongsToOtherStage = stages.some(s => 
          s.id !== currentStage.id && (
            s.nome === lead.stage_name || s.legacy_key === lead.stage_name
          )
        );
        if (!belongsToOtherStage) return true;
      }
      
      if ((!lead.stage_name || lead.stage_name === '') && 
          currentStage?.legacy_key && 
          lead.etapa === currentStage.legacy_key) {
        return true;
      }
      
      return false;
    });

    // Ordenar por stage_order (leads sem ordem vão ao final)
    return filtered.sort((a, b) => {
      const orderA = (a as any).stage_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = (b as any).stage_order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      // Fallback: ordenar por data de criação
      return new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime();
    });
  }, [leads, stages]);

  // Pre-compute all stage leads
  const stageLeadsMap = useMemo(() => {
    const map: Record<string, (Lead & { userId?: string; stage_order?: number })[]> = {};
    stages.forEach(stage => {
      map[stage.nome] = getLeadsByStage(stage.nome);
    });
    return map;
  }, [stages, getLeadsByStage]);

  const calculateNewOrder = (stageLeads: any[], destinationIndex: number, draggedLeadId: string) => {
    // Filter out the dragged lead from the list
    const otherLeads = stageLeads.filter(l => l.id !== draggedLeadId);
    
    if (otherLeads.length === 0) return 1000;
    
    if (destinationIndex === 0) {
      // Inserting at the beginning
      const firstOrder = (otherLeads[0] as any).stage_order ?? 1000;
      return Math.max(1, firstOrder - 1000);
    }
    
    if (destinationIndex >= otherLeads.length) {
      // Inserting at the end
      const lastOrder = (otherLeads[otherLeads.length - 1] as any).stage_order ?? otherLeads.length * 1000;
      return lastOrder + 1000;
    }
    
    // Inserting between two leads
    const prevOrder = (otherLeads[destinationIndex - 1] as any).stage_order ?? (destinationIndex - 1) * 1000;
    const nextOrder = (otherLeads[destinationIndex] as any).stage_order ?? destinationIndex * 1000;
    return Math.floor((prevOrder + nextOrder) / 2);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const targetStageName = destination.droppableId;
    const targetStageLeads = stageLeadsMap[targetStageName] || [];
    
    const newOrder = calculateNewOrder(targetStageLeads, destination.index, draggableId);

    const updates: any = { stage_order: newOrder };
    
    // Only update stage_name if moving between columns
    if (source.droppableId !== destination.droppableId) {
      updates.stage_name = targetStageName;
    }

    onLeadUpdate(draggableId, updates);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando etapas...</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
        {stages.map((stage) => {
          const stageLeads = stageLeadsMap[stage.nome] || [];
          const colorClasses = getColorClasses(stage.cor);
          const visibleCount = getVisibleCount(stage.nome);
          const visibleLeads = stageLeads.slice(0, visibleCount);
          const hasMore = stageLeads.length > visibleCount;
          const remainingCount = stageLeads.length - visibleCount;
          
          return (
            <div
              key={stage.id}
              className={`kanban-column min-w-80 ${colorClasses.color} rounded-xl p-4`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: colorClasses.headerColor }}
                  />
                  <h3 className="font-semibold text-foreground">{stage.nome}</h3>
                  <span className="bg-card text-muted-foreground text-sm px-2 py-1 rounded-full font-medium">
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

              <Droppable droppableId={stage.nome}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar min-h-[60px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent/30 rounded-lg' : ''
                    }`}
                  >
                    {visibleLeads.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move ${snapshot.isDragging ? 'opacity-80 shadow-lg' : ''}`}
                          >
                            <LeadCard
                              lead={lead}
                              onClick={() => onLeadClick(lead)}
                              onUpdate={(updates) => onLeadUpdate(lead.id, updates)}
                              userId={lead.userId}
                              onOptimisticUpdate={onOptimisticUpdate}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {hasMore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-foreground py-3 border border-dashed border-border hover:border-muted-foreground"
                        onClick={() => handleShowMore(stage.nome)}
                      >
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Ver mais {Math.min(remainingCount, LEADS_PER_PAGE)} de {remainingCount}
                      </Button>
                    )}
                    
                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Nenhum lead nesta etapa</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
