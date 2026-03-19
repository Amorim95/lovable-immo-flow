import { useState, useMemo, useCallback } from "react";
import { Lead, LeadStage } from "@/types/crm";
import { LeadCard } from "./LeadCard";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { useLeadStages } from "@/hooks/useLeadStages";
import { useUserRole } from "@/hooks/useUserRole";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const LEADS_PER_PAGE = 20;

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
  autoRepiqueEnabled?: boolean;
  autoRepiqueMinutes?: number;
}

export function KanbanBoard({ leads, onLeadUpdate, onLeadClick, onCreateLead, onOptimisticUpdate, autoRepiqueEnabled, autoRepiqueMinutes }: KanbanBoardProps) {
  const [stageVisibleCounts, setStageVisibleCounts] = useState<Record<string, number>>({});
  const [stageSortOrder, setStageSortOrder] = useState<Record<string, 'newest' | 'oldest' | undefined>>({});
  const { stages, loading } = useLeadStages();
  const { isAdmin, isGestor } = useUserRole();
  const canTransfer = isAdmin || isGestor;

  const getVisibleCount = (stageName: string) => {
    return stageVisibleCounts[stageName] || LEADS_PER_PAGE;
  };

  const handleShowMore = (stageName: string) => {
    setStageVisibleCounts(prev => ({
      ...prev,
      [stageName]: (prev[stageName] || LEADS_PER_PAGE) + LEADS_PER_PAGE
    }));
  };

  const hasManualOrder = (lead: { stage_order?: number | null }) => {
    return lead.stage_order != null && lead.stage_order !== 0;
  };

  const getLeadsByStage = useCallback((stageName: string) => {
    const currentStage = stages.find(s => s.nome === stageName);
    const sortOrder = stageSortOrder[stageName]; // undefined = default (hybrid), 'newest' | 'oldest' = pure date
    
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

    // Quando o usuário clicou no botão de ordenar, ordena puramente por data
    if (sortOrder === 'oldest') {
      return filtered.sort((a, b) => 
        new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime()
      );
    }

    if (sortOrder === 'newest') {
      return filtered.sort((a, b) => 
        new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      );
    }

    // Default (sem clique no botão): leads com ordem manual primeiro, depois por data desc
    return filtered.sort((a, b) => {
      const hasManualA = hasManualOrder(a);
      const hasManualB = hasManualOrder(b);
      
      if (hasManualA && hasManualB) {
        return (a as any).stage_order - (b as any).stage_order;
      }

      if (hasManualA) return -1;
      if (hasManualB) return 1;

      return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
    });
  }, [leads, stages, stageSortOrder]);

  // Pre-compute all stage leads
  const stageLeadsMap = useMemo(() => {
    const map: Record<string, (Lead & { userId?: string; stage_order?: number })[]> = {};
    stages.forEach(stage => {
      map[stage.nome] = getLeadsByStage(stage.nome);
    });
    return map;
  }, [stages, getLeadsByStage]);

  const calculateNewOrder = (stageLeads: any[], destinationIndex: number, draggedLeadId: string) => {
    const otherLeads = stageLeads.filter(l => l.id !== draggedLeadId);
    
    if (otherLeads.length === 0) return 1000;

    const ensureNonZeroOrder = (order: number, fallback: number) => {
      return order === 0 ? fallback : order;
    };
    
    // Assign virtual orders based on actual sorted position for leads without manual order
    const withVirtualOrder = otherLeads.map((lead, idx) => ({
      ...lead,
      _virtualOrder: hasManualOrder(lead) ? lead.stage_order : (idx + 1) * 1000
    }));

    // Normalize: ensure virtual orders are strictly increasing to match visual order
    for (let i = 1; i < withVirtualOrder.length; i++) {
      if (withVirtualOrder[i]._virtualOrder <= withVirtualOrder[i - 1]._virtualOrder) {
        withVirtualOrder[i]._virtualOrder = withVirtualOrder[i - 1]._virtualOrder + 1;
      }
    }
    
    if (destinationIndex === 0) {
      return ensureNonZeroOrder(withVirtualOrder[0]._virtualOrder - 1000, -0.5);
    }
    
    if (destinationIndex >= withVirtualOrder.length) {
      return ensureNonZeroOrder(withVirtualOrder[withVirtualOrder.length - 1]._virtualOrder + 1000, 0.5);
    }
    
    const prevOrder = withVirtualOrder[destinationIndex - 1]._virtualOrder;
    const nextOrder = withVirtualOrder[destinationIndex]._virtualOrder;
    return ensureNonZeroOrder((prevOrder + nextOrder) / 2, prevOrder < 0 ? -0.5 : 0.5);
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
      // Também passar legacy_key como etapa para manter consistência com o enum
      const targetStage = stages.find(s => s.nome === targetStageName);
      if (targetStage?.legacy_key) {
        updates.etapa = targetStage.legacy_key;
      }
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
                <div className="flex items-center gap-1">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${stageSortOrder[stage.nome] ? 'bg-accent' : ''}`}
                          onClick={() => {
                            setStageSortOrder(prev => {
                              const current = prev[stage.nome];
                              const next = !current ? 'newest' : current === 'newest' ? 'oldest' : undefined;
                              const updated = { ...prev };
                              if (next) {
                                updated[stage.nome] = next;
                              } else {
                                delete updated[stage.nome];
                              }
                              return updated;
                            });
                          }}
                          title={`Ordenar por data`}
                        >
                          {!stageSortOrder[stage.nome]
                            ? <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                            : stageSortOrder[stage.nome] === 'newest'
                              ? <ArrowDown className="w-3.5 h-3.5 text-primary" />
                              : <ArrowUp className="w-3.5 h-3.5 text-primary" />
                          }
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {!stageSortOrder[stage.nome]
                          ? 'Ordenar por data (mais novos)' 
                          : stageSortOrder[stage.nome] === 'newest'
                            ? 'Mais novos primeiro (clique para mais antigos)'
                            : 'Mais antigos primeiro (clique para desativar)'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                              canTransfer={canTransfer}
                              autoRepiqueEnabled={autoRepiqueEnabled}
                              autoRepiqueMinutes={autoRepiqueMinutes}
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
