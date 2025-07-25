import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lead } from "@/types/crm";
import { useLeadsOptimized } from "@/hooks/useLeadsOptimized";
import { useUserRole } from "@/hooks/useUserRole";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MessageCircle, Calendar, User, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NewLeadModal } from "@/components/NewLeadModal";
import { DateFilter, DateFilterOption, getDateRangeFromFilter } from "@/components/DateFilter";
import { UserFilter } from "@/components/UserFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stageColors = {
  'aguardando-atendimento': 'bg-slate-100 text-slate-800',
  'tentativas-contato': 'bg-yellow-100 text-yellow-800',
  'atendeu': 'bg-blue-100 text-blue-800',
  'visita': 'bg-purple-100 text-purple-800',
  'vendas-fechadas': 'bg-green-100 text-green-800',
  'em-pausa': 'bg-orange-100 text-orange-800'
};

const stageLabels = {
  'aguardando-atendimento': 'Aguardando Atendimento',
  'tentativas-contato': 'Em Tentativas de Contato',
  'atendeu': 'Atendeu',
  'visita': 'Visita',
  'vendas-fechadas': 'Vendas Fechadas',
  'em-pausa': 'Em Pausa'
};

export default function MobileLeads() {
  const navigate = useNavigate();
  const { leads, loading, error, refreshLeads, updateLeadOptimistic } = useLeadsOptimized();
  const { isAdmin, isGestor, isCorretor, loading: roleLoading } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();
  
  const canCreateLeads = !roleLoading && (isAdmin || isGestor || isCorretor);

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
    etiquetas: lead.lead_tag_relations?.map(rel => rel.lead_tags?.nome as Lead['etiquetas'][0]).filter(Boolean) || [],
    corretor: lead.user?.name || 'Não atribuído',
    atividades: (Array.isArray(lead.atividades) ? lead.atividades : []).map((atividade: any) => ({
      id: atividade.id,
      tipo: atividade.tipo as any,
      descricao: atividade.descricao,
      data: new Date(atividade.data),
      corretor: atividade.corretor
    })),
    status: 'ativo'
  }));

  // Aplicar filtros
  const filteredLeads = convertedLeads.filter(lead => {
    // Filtro de texto
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.dadosAdicionais && lead.dadosAdicionais.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.corretor.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de usuário
    const matchesUser = !selectedUserId || leads.find(l => l.id === lead.id)?.user_id === selectedUserId;

    // Filtro de data
    let matchesDate = true;
    if (dateFilter !== 'periodo-total') {
      const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);
      if (dateRange) {
        const leadDate = lead.dataCriacao;
        matchesDate = leadDate >= dateRange.from && leadDate <= dateRange.to;
      }
    }

    return matchesSearch && matchesUser && matchesDate;
  });

  const handleLeadClick = (lead: Lead) => {
    navigate(`/lead/${lead.id}`);
  };

  const handleWhatsApp = (telefone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const handleCall = (telefone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${telefone}`, '_self');
  };

  const handleCreateLead = () => {
    refreshLeads();
  };

  const handleStageChange = async (leadId: string, newStage: Lead['etapa']) => {
    await updateLeadOptimistic(leadId, { etapa: newStage });
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Gestão de Leads" />
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Gestão de Leads" />
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refreshLeads}>Tentar Novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title=""
        logoOnly={true}
        rightElement={
          canCreateLeads && (
            <Button
              size="sm"
              onClick={() => setIsNewLeadModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )
        }
      />

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Períodos</span>
          </div>
          
          <DateFilter
            value={dateFilter}
            onValueChange={(option, customRange) => {
              setDateFilter(option);
              if (customRange) {
                setCustomDateRange(customRange);
              }
            }}
            customRange={customDateRange}
            className="w-full"
          />
          
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por Usuário</span>
          </div>
          
          <UserFilter
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total de Leads</span>
            <span className="font-semibold text-gray-900">{convertedLeads.length}</span>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="px-4 space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum lead encontrado</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => handleLeadClick(lead)}
              className="bg-white rounded-lg p-4 shadow-sm border active:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{lead.nome}</h3>
                  <p className="text-sm text-gray-500 truncate">{lead.telefone}</p>
                </div>
                <div className="relative">
                  <Select
                    value={lead.etapa}
                    onValueChange={(value) => {
                      handleStageChange(lead.id, value as Lead['etapa']);
                    }}
                  >
                    <SelectTrigger 
                      className={`ml-2 h-auto p-1 text-xs border-none shadow-none ${stageColors[lead.etapa]}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue />
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(stageLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {lead.dadosAdicionais && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {lead.dadosAdicionais}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span>{lead.corretor}</span>
                  <span className="mx-1">•</span>
                  <span>{lead.dataCriacao.toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleWhatsApp(lead.telefone, e)}
                    className="p-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Lead Modal */}
      {canCreateLeads && (
        <NewLeadModal
          isOpen={isNewLeadModalOpen}
          onClose={() => setIsNewLeadModalOpen(false)}
          onCreateLead={handleCreateLead}
          initialStage="aguardando-atendimento"
        />
      )}
    </div>
  );
}