
import { useState } from "react";
import { Lead } from "@/types/crm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { LeadModal } from "@/components/LeadModal";
import { NewLeadModal } from "@/components/NewLeadModal";
import { useLeadsAccess } from "@/hooks/useLeadsAccess";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { 
  LayoutList, 
  LayoutGrid,
  Plus
} from "lucide-react";

const Index = () => {
  const { leads, loading, error, refreshLeads } = useLeadsAccess();
  const { isAdmin, isGestor, isCorretor, loading: roleLoading } = useUserRole();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadStage, setNewLeadStage] = useState<Lead['etapa']>('aguardando-atendimento'); // Estado para controlar a etapa do novo lead
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  // Permitir criação de leads para todos os usuários autenticados
  const canCreateLeads = !roleLoading && (isAdmin || isGestor || isCorretor);

  const handleLeadUpdate = async (leadId: string, updates: Partial<Lead>) => {
    try {
      // Preparar dados para o Supabase (mapear campos da interface para o banco)
      const supabaseUpdates: any = {};
      
      if (updates.nome !== undefined) supabaseUpdates.nome = updates.nome;
      if (updates.telefone !== undefined) supabaseUpdates.telefone = updates.telefone;
      if (updates.dadosAdicionais !== undefined) supabaseUpdates.dados_adicionais = updates.dadosAdicionais;
      if (updates.etapa !== undefined) supabaseUpdates.etapa = updates.etapa;
      
      // Atualizar no banco se há mudanças nos campos persistidos
      if (Object.keys(supabaseUpdates).length > 0) {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase
          .from('leads')
          .update(supabaseUpdates)
          .eq('id', leadId);
          
        if (error) {
          console.error('Erro ao atualizar lead:', error);
          return;
        }
      }
      
      // Atualizar o lead local se estiver selecionado (para etiquetas e atividades)
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({
          ...selectedLead,
          ...updates
        });
      }
      
      // Refresh da lista
      refreshLeads();
    } catch (error) {
      console.error('Erro ao processar atualização:', error);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    // Adicionar atividade de visualização antes de abrir o modal
    const viewActivity = {
      id: Date.now().toString(),
      tipo: 'observacao' as const,
      descricao: `Lead Visualizado Por: ${lead.corretor} às ${new Date().toLocaleString('pt-BR')}`,
      data: new Date(),
      corretor: lead.corretor
    };

    // Atualizar o lead com a nova atividade
    const updatedLead = {
      ...lead,
      atividades: [...lead.atividades, viewActivity]
    };

    setSelectedLead(updatedLead);
    setIsModalOpen(true);
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
  const convertedLeads: Lead[] = leads.map(lead => ({
    id: lead.id,
    nome: lead.nome,
    telefone: lead.telefone,
    dadosAdicionais: lead.dados_adicionais || '',
    campanha: 'Não especificada',
    conjunto: 'Não especificado',
    anuncio: 'Não especificado',
    dataCriacao: new Date(lead.created_at),
    etapa: lead.etapa as Lead['etapa'],
    etiquetas: [],
    corretor: lead.user?.name || 'Não atribuído',
    atividades: [],
    status: 'ativo'
  }));

  const filteredLeads = convertedLeads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.dadosAdicionais && lead.dadosAdicionais.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.corretor.toLowerCase().includes(searchTerm.toLowerCase());

    const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);
    const matchesDate = !dateRange || (
      lead.dataCriacao >= dateRange.from && lead.dataCriacao <= dateRange.to
    );

    return matchesSearch && matchesDate;
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            leads={filteredLeads}
            onLeadUpdate={handleLeadUpdate}
            onLeadClick={handleLeadClick}
            onCreateLead={handleCreateLeadInStage}
          />
        ) : (
          <ListView
            leads={filteredLeads}
            onLeadClick={handleLeadClick}
            onLeadUpdate={handleLeadUpdate}
          />
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
