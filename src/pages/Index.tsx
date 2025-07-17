
import { useState } from "react";
import { Lead } from "@/types/crm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { LeadModal } from "@/components/LeadModal";
import { NewLeadModal } from "@/components/NewLeadModal";
import { AccessControlWrapper } from "@/components/AccessControlWrapper";
import { useLeadsAccess } from "@/hooks/useLeadsAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { 
  LayoutList, 
  LayoutGrid,
  Plus,
  Calendar
} from "lucide-react";

const Index = () => {
  const { leads, loading, error, refreshLeads, canCreateLeads } = useLeadsAccess();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();

  const handleLeadUpdate = (leadId: string, updates: Partial<Lead>) => {
    // Atualizar lead localmente e depois sincronizar com o banco
    refreshLeads();
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCreateLead = (leadData: Partial<Lead>) => {
    // Após criar lead, recarregar dados
    refreshLeads();
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

  if (loading) {
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
              onClick={() => setIsNewLeadModalOpen(true)}
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

      <AccessControlWrapper allowCorretor={canCreateLeads}>
        <NewLeadModal
          isOpen={isNewLeadModalOpen}
          onClose={() => setIsNewLeadModalOpen(false)}
          onCreateLead={handleCreateLead}
        />
      </AccessControlWrapper>
    </div>
  );
};

export default Index;
