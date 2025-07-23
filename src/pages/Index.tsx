
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lead } from "@/types/crm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { LeadModal } from "@/components/LeadModal";
import { NewLeadModal } from "@/components/NewLeadModal";
import { UserFilter } from "@/components/UserFilter";
import { useLeadsOptimized } from "@/hooks/useLeadsOptimized";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
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
  const { isAdmin, isGestor, isCorretor, loading: roleLoading } = useUserRole();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadStage, setNewLeadStage] = useState<Lead['etapa']>('aguardando-atendimento'); // Estado para controlar a etapa do novo lead
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Permitir criação de leads para todos os usuários autenticados
  const canCreateLeads = !roleLoading && (isAdmin || isGestor || isCorretor);

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

  const handleLeadClick = (lead: Lead) => {
    if (isMobile) {
      // No mobile, navegar para a tela de detalhes
      navigate(`/lead/${lead.id}`);
    } else {
      // No desktop, abrir modal
      const viewActivity = {
        id: Date.now().toString(),
        tipo: 'observacao' as const,
        descricao: `Lead Visualizado às ${new Date().toLocaleString('pt-BR')}`,
        data: new Date(),
        corretor: user?.name || 'Usuário não identificado'
      };

      const updatedLead = {
        ...lead,
        atividades: [...lead.atividades, viewActivity]
      };

      setSelectedLead(updatedLead);
      setIsModalOpen(true);
    }
  };

  const handleCreateLead = (leadData: Partial<Lead>) => {
    refreshLeads();
  };

  const handleCreateLeadInStage = (stage: Lead['etapa']) => {
    setNewLeadStage(stage);
    setIsNewLeadModalOpen(true);
  };

  const handleDateFilterChange = (option: DateFilterOption, customRange?: DateRange) => {
    setDateFilter(option);
    if (customRange) {
      setCustomDateRange(customRange);
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

  const filteredLeads = convertedLeads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.dadosAdicionais && lead.dadosAdicionais.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.corretor.toLowerCase().includes(searchTerm.toLowerCase());

    const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);
    const matchesDate = !dateRange || (
      lead.dataCriacao >= dateRange.from && lead.dataCriacao <= dateRange.to
    );

    // Filtro por usuário (apenas para admin e gestor)
    let matchesUser = true;
    if ((isAdmin || isGestor) && selectedUserId) {
      const originalLead = leads.find(l => l.id === lead.id);
      matchesUser = originalLead?.user_id === selectedUserId;
    }

    return matchesSearch && matchesDate && matchesUser;
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
            />
            {/* Filtro de Usuário - Apenas para Admin e Gestor */}
            {(isAdmin || isGestor) && (
              <UserFilter
                onUserChange={setSelectedUserId}
                selectedUserId={selectedUserId}
              />
            )}
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
