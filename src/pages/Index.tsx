import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lead } from "@/types/crm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { LeadModal } from "@/components/LeadModal";
import { NewLeadModal } from "@/components/NewLeadModal";
import { TeamUserFilters } from "@/components/TeamUserFilters";
import { TagFilter } from "@/components/TagFilter";
import { StageFilter } from "@/components/StageFilter";
import { useLeadsOptimized } from "@/hooks/useLeadsOptimized";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useManagerTeam } from "@/hooks/useManagerTeam";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useDailyQuote } from "@/hooks/useDailyQuote";
import { supabase } from "@/integrations/supabase/client";
import { LayoutList, LayoutGrid, Plus, Search, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { NotificationPromptBanner } from "@/components/NotificationPromptBanner";
import { NotificationSoundPlayer } from "@/components/NotificationSoundPlayer";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const {
    leads,
    loading,
    error,
    refreshLeads,
    updateLeadOptimistic
  } = useLeadsOptimized();
  const {
    isAdmin,
    isGestor,
    isCorretor,
    isDono,
    loading: roleLoading
  } = useUserRole();
  const {
    managedTeamId,
    loading: teamLoading
  } = useManagerTeam();
  
  const dailyQuote = useDailyQuote();
  
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadStage, setNewLeadStage] = useState<Lead['etapa']>('aguardando-atendimento');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedStageKey, setSelectedStageKey] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pré-selecionar equipe gerenciada automaticamente
  useEffect(() => {
    if (!teamLoading && managedTeamId && !selectedTeamId) {
      setSelectedTeamId(managedTeamId);
    }
  }, [teamLoading, managedTeamId, selectedTeamId]);

  // Permitir criação de leads para todos os usuários autenticados
  const canCreateLeads = !roleLoading && (isAdmin || isGestor || isCorretor || isDono);
  
  const handleLeadUpdate = async (leadId: string, updates: Partial<Lead>) => {
    const success = await updateLeadOptimistic(leadId, updates);

    // Atualizar o lead local se estiver selecionado (para atividades)
    if (success && selectedLead && selectedLead.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        ...updates
      });
    }
  };

  const handleLeadClick = async (lead: Lead) => {
    // Marcar primeira visualização se ainda não foi visualizado
    if (!lead.primeira_visualizacao) {
      try {
        const { error } = await supabase.from('leads').update({
          primeira_visualizacao: new Date().toISOString()
        }).eq('id', lead.id);
        if (!error) {
          refreshLeads();
        }
      } catch (error) {
        console.error('Erro ao marcar primeira visualização:', error);
      }
    }
    if (isMobile) {
      navigate(`/lead/${lead.id}`);
    } else {
      setSelectedLead(lead);
      setIsModalOpen(true);
    }
  };

  const handleCreateLead = (leadData: Partial<Lead>) => {
    refreshLeads();
  };

  const handleCreateLeadInStage = (stageName: string) => {
    setNewLeadStage('aguardando-atendimento');
    setIsNewLeadModalOpen(true);
  };

  const handleDateFilterChange = (option: DateFilterOption, customRange?: DateRange) => {
    setDateFilter(option);
    if (option === 'personalizado' && customRange) {
      setCustomDateRange(customRange);
    } else if (option !== 'personalizado') {
      setCustomDateRange(undefined);
    }
  };

  // Converter dados do Supabase para formato da interface
  const convertedLeads: (Lead & { userId: string })[] = leads.map(lead => ({
    id: lead.id,
    nome: lead.nome,
    telefone: lead.telefone,
    dadosAdicionais: lead.dados_adicionais || '',
    campanha: 'Não especificada',
    conjunto: 'Não especificado',
    anuncio: 'Não especificado',
    dataCriacao: new Date(lead.created_at),
    etapa: lead.etapa as Lead['etapa'],
    stage_name: lead.stage_name,
    etiquetas: lead.lead_tag_relations?.map(rel => rel.lead_tags?.nome as Lead['etiquetas'][0]).filter(Boolean) || [],
    corretor: lead.user?.name || 'Não atribuído',
    atividades: (Array.isArray(lead.atividades) ? lead.atividades : []).map((atividade: any) => ({
      id: atividade.id,
      tipo: atividade.tipo as any,
      descricao: atividade.descricao,
      data: new Date(atividade.data),
      corretor: atividade.corretor
    })),
    status: 'ativo',
    userId: lead.user_id || lead.id
  }));

  // Extrair datas únicas dos leads para o DateFilter
  const availableDates = [...new Set(convertedLeads.map(lead => lead.dataCriacao.toDateString()))].map(dateString => new Date(dateString));
  
  const filteredLeads = convertedLeads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (lead.dadosAdicionais && lead.dadosAdicionais.toLowerCase().includes(searchTerm.toLowerCase())) || 
      lead.corretor.toLowerCase().includes(searchTerm.toLowerCase());
    const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);
    const matchesDate = !dateRange || (lead.dataCriacao >= dateRange.from && lead.dataCriacao <= dateRange.to);

    // Filtro por usuário (apenas para admin, gestor e dono)
    let matchesUser = true;
    if ((isAdmin || isGestor || isDono) && selectedUserId) {
      const originalLead = leads.find(l => l.id === lead.id);
      matchesUser = originalLead?.user_id === selectedUserId;
    }

    // Filtro por equipe (apenas para admin, gestor e dono)
    let matchesTeam = true;
    if ((isAdmin || isGestor || isDono) && selectedTeamId) {
      const originalLead = leads.find(l => l.id === lead.id);
      if (originalLead?.user?.equipe_id) {
        matchesTeam = originalLead.user.equipe_id === selectedTeamId;
      } else {
        matchesTeam = false;
      }
    }

    // Filtro por etiquetas
    let matchesTags = true;
    if (selectedTagIds.length > 0) {
      const originalLead = leads.find(l => l.id === lead.id);
      if (originalLead?.lead_tag_relations) {
        const leadTagIds = originalLead.lead_tag_relations.map((relation: any) => relation.lead_tags?.id).filter(Boolean);
        matchesTags = selectedTagIds.some(tagId => leadTagIds.includes(tagId));
      } else {
        matchesTags = false;
      }
    }

    // Filtro por etapa (apenas no modo lista)
    let matchesStage = true;
    if (selectedStageKey && viewMode === 'list') {
      const leadStageKey = lead.stage_name || lead.etapa;
      if (leadStageKey && selectedStageKey) {
        matchesStage = leadStageKey === selectedStageKey;
      } else {
        matchesStage = false;
      }
    }
    return matchesSearch && matchesDate && matchesUser && matchesTeam && matchesTags && matchesStage;
  });

  if (loading || roleLoading || teamLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
        <Button onClick={refreshLeads}>Tentar Novamente</Button>
      </div>
    );
  }

  const totalLeads = convertedLeads.length;
  const leadsHoje = convertedLeads.filter(lead => {
    const hoje = new Date();
    const leadDate = new Date(lead.dataCriacao);
    return leadDate.toDateString() === hoje.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Notification Sound Player - listens for push events */}
      <NotificationSoundPlayer />
      
      {/* Banner de notificações para desktop */}
      {!isMobile && <NotificationPromptBanner />}
      
      {/* Header */}
      <div className="flex items-center gap-4">
        {canCreateLeads && (
          <Button 
            className="bg-primary hover:bg-primary/90" 
            onClick={() => {
              setNewLeadStage('aguardando-atendimento');
              setIsNewLeadModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        )}
        
        <span className="text-lg font-medium text-muted-foreground italic">
          "{dailyQuote}"
        </span>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Barra principal - sempre visível */}
        <div className="p-4 flex items-center gap-4 flex-wrap">
          {/* Toggle Kanban/Lista */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-r-none px-3"
              title="Visualização Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <LayoutList className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>

          {/* Campo de busca */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Botão de Filtros Avançados */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {/* Badge com contagem de filtros ativos */}
            {(() => {
              const activeCount = 
                (dateFilter !== 'periodo-total' ? 1 : 0) +
                (selectedTeamId ? 1 : 0) +
                (selectedUserId ? 1 : 0) +
                (selectedTagIds.length > 0 ? 1 : 0) +
                (selectedStageKey ? 1 : 0);
              return activeCount > 0 ? (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeCount}
                </Badge>
              ) : null;
            })()}
            {filtersOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Filtros Avançados - Colapsável */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent className="border-t">
            <div className="p-4 flex items-center gap-4 flex-wrap bg-muted/30">
              <DateFilter 
                value={dateFilter} 
                customRange={customDateRange} 
                onValueChange={handleDateFilterChange} 
                availableDates={availableDates} 
              />
              
              {/* Filtros de Equipe e Usuário - Apenas para Admin, Gestor e Dono */}
              {(isAdmin || isGestor || isDono) && (
                <TeamUserFilters 
                  onTeamChange={setSelectedTeamId} 
                  onUserChange={setSelectedUserId} 
                  selectedTeamId={selectedTeamId} 
                  selectedUserId={selectedUserId} 
                />
              )}
              
              {/* Filtro de Etiquetas */}
              <TagFilter 
                selectedTagIds={selectedTagIds} 
                onTagChange={setSelectedTagIds} 
                className="w-64" 
              />
              
              {/* Filtro de Etapas - Apenas no modo lista */}
              {viewMode === 'list' && (
                <StageFilter 
                  selectedStageKey={selectedStageKey} 
                  onStageChange={setSelectedStageKey} 
                  className="w-64" 
                />
              )}

              {/* Botão Limpar Filtros */}
              {(dateFilter !== 'periodo-total' || selectedTeamId || selectedUserId || selectedTagIds.length > 0 || selectedStageKey) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFilter('periodo-total');
                    setCustomDateRange(undefined);
                    setSelectedTeamId(null);
                    setSelectedUserId(null);
                    setSelectedTagIds([]);
                    setSelectedStageKey(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Content */}
      <div className="min-h-[600px] transition-all duration-300 ease-in-out">
        {isMobile || viewMode === 'list' ? (
          <div className="animate-fade-in">
            <ListView 
              leads={filteredLeads} 
              onLeadClick={handleLeadClick} 
              onLeadUpdate={handleLeadUpdate} 
              onOptimisticUpdate={updateLeadOptimistic} 
            />
          </div>
        ) : (
          <div className="animate-fade-in">
            <KanbanBoard 
              leads={filteredLeads} 
              onLeadUpdate={handleLeadUpdate} 
              onLeadClick={handleLeadClick} 
              onCreateLead={handleCreateLeadInStage} 
              onOptimisticUpdate={updateLeadOptimistic} 
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <LeadModal 
        lead={selectedLead} 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }} 
        onUpdate={handleLeadUpdate} 
      />

      {canCreateLeads && (
        <NewLeadModal 
          isOpen={isNewLeadModalOpen} 
          onClose={() => {
            setIsNewLeadModalOpen(false);
            setNewLeadStage('aguardando-atendimento');
          }} 
          onCreateLead={handleCreateLead} 
          initialStage={newLeadStage} 
        />
      )}
    </div>
  );
};

export default Index;
