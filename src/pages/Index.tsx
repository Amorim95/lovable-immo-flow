
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lead } from "@/types/crm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { LeadModal } from "@/components/LeadModal";
import { NewLeadModal } from "@/components/NewLeadModal";
import { TeamUserFilters } from "@/components/TeamUserFilters";
import { TagFilter } from "@/components/TagFilter";
import { useLeadsOptimized } from "@/hooks/useLeadsOptimized";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutList, 
  LayoutGrid,
  Plus
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { leads, loading, error, refreshLeads, updateLeadOptimistic } = useLeadsOptimized();
  const { isAdmin, isGestor, isCorretor, isDono, loading: roleLoading } = useUserRole();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadStage, setNewLeadStage] = useState<Lead['etapa']>('aguardando-atendimento'); // Estado para controlar a etapa do novo lead
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

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
        const { error } = await supabase
          .from('leads')
          .update({ primeira_visualizacao: new Date().toISOString() })
          .eq('id', lead.id);
        
        if (!error) {
          // Atualizar os dados após marcar a visualização
          refreshLeads();
        }
      } catch (error) {
        console.error('Erro ao marcar primeira visualização:', error);
      }
    }

    if (isMobile) {
      // No mobile, navegar para a tela de detalhes
      navigate(`/lead/${lead.id}`);
    } else {
      // No desktop, abrir modal
      setSelectedLead(lead);
      setIsModalOpen(true);
    }
  };

  const handleCreateLead = (leadData: Partial<Lead>) => {
    refreshLeads();
  };

  const handleCreateLeadInStage = (stageName: string) => {
    // Por enquanto, manter criação com etapa padrão; futuras melhorias: suportar stage_name customizado
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
    userId: lead.user_id || lead.id // Incluir o user_id real
  }));

  // Extrair datas únicas dos leads para o DateFilter
  const availableDates = [...new Set(convertedLeads.map(lead => 
    lead.dataCriacao.toDateString()
  ))].map(dateString => new Date(dateString));

  const filteredLeads = convertedLeads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.dadosAdicionais && lead.dadosAdicionais.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.corretor.toLowerCase().includes(searchTerm.toLowerCase());

    const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);
    const matchesDate = !dateRange || (
      lead.dataCriacao >= dateRange.from && lead.dataCriacao <= dateRange.to
    );

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
        matchesTeam = false; // Se não tem equipe, não mostra no filtro de equipe
      }
    }

    // Filtro por etiquetas
    let matchesTags = true;
    if (selectedTagIds.length > 0) {
      const originalLead = leads.find(l => l.id === lead.id);
      console.log('Filtrando por tags - Lead:', lead.nome, 'selectedTagIds:', selectedTagIds);
      console.log('Original lead tag relations:', originalLead?.lead_tag_relations);
      
      if (originalLead?.lead_tag_relations) {
        const leadTagIds = originalLead.lead_tag_relations.map((relation: any) => relation.lead_tags?.id).filter(Boolean);
        console.log('Lead tag IDs:', leadTagIds);
        matchesTags = selectedTagIds.some(tagId => leadTagIds.includes(tagId));
        console.log('Matches tags:', matchesTags);
      } else {
        console.log('Lead não tem tag relations');
        matchesTags = false;
      }
    }

    return matchesSearch && matchesDate && matchesUser && matchesTeam && matchesTags;
  });

  if (loading || roleLoading) {
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus leads aqui ({totalLeads} leads total, {leadsHoje} hoje)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          {!isMobile && (
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="px-3"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Padrão
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <LayoutList className="w-4 h-4 mr-2" />
                Lista
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
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
          </div>
        </div>
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
            setNewLeadStage('aguardando-atendimento'); // Reset para padrão
          }}
          onCreateLead={handleCreateLead}
          initialStage={newLeadStage}
        />
      )}
    </div>
  );
};

export default Index;
