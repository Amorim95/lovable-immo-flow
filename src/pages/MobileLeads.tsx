import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Lead } from "@/types/crm";
import { useLeadsOptimized } from "@/hooks/useLeadsOptimized";
import { useUserRole } from "@/hooks/useUserRole";
import { useManagerTeam } from "@/hooks/useManagerTeam";
import { useLeadStages } from "@/hooks/useLeadStages";
import { useDailyQuote } from "@/hooks/useDailyQuote";
import { useAuth } from "@/contexts/AuthContext";
import { MobileHeader } from "@/components/MobileHeader";
import { TagFilter } from "@/components/TagFilter";
import { NotificationPromptBanner } from "@/components/NotificationPromptBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Calendar, User, ChevronDown, Filter, Tag, Users } from "lucide-react";
import { DateFilter, DateFilterOption, getDateRangeFromFilter } from "@/components/DateFilter";
import { UserFilter } from "@/components/UserFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Equipe {
  id: string;
  nome: string;
  responsavel_nome: string | null;
}

export default function MobileLeads() {
  const navigate = useNavigate();
  const { leads, loading, error, refreshLeads, updateLeadOptimistic } = useLeadsOptimized();
  const { isAdmin, isGestor, isCorretor, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const quote = useDailyQuote();
  const { stages, loading: stagesLoading } = useLeadStages();
  
  // Criar mapa de stages para acesso rápido por nome
  const stageMap = useMemo(() => {
    const map: Record<string, { nome: string; cor: string }> = {};
    stages.forEach(stage => {
      map[stage.nome] = { nome: stage.nome, cor: stage.cor };
      if (stage.legacy_key) {
        map[stage.legacy_key] = { nome: stage.nome, cor: stage.cor };
      }
    });
    return map;
  }, [stages]);
  
  // Função para obter cor da etapa
  const getStageColor = (stageName: string) => {
    return stageMap[stageName]?.cor || '#94a3b8';
  };
  
  // Função para obter nome da etapa
  const getStageName = (stageName: string) => {
    return stageMap[stageName]?.nome || stageName;
  };
  const { managedTeamId, loading: teamLoading } = useManagerTeam();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('periodo-total');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  
  // Estado do formulário de novo lead
  // Paginação de leads
  const LEADS_PER_PAGE = 50;
  const [visibleLeadsCount, setVisibleLeadsCount] = useState(LEADS_PER_PAGE);
  
  const [newLeadFormData, setNewLeadFormData] = useState({
    nome: '',
    telefone: '',
    dadosAdicionais: ''
  });
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  
  const canCreateLeads = !roleLoading && (isAdmin || isGestor || isCorretor);

  // Resetar contagem de leads visíveis quando filtros mudam
  useEffect(() => {
    setVisibleLeadsCount(LEADS_PER_PAGE);
  }, [searchTerm, selectedUserId, selectedTeamId, selectedStage, selectedTagIds, dateFilter, customDateRange]);

  // Pré-selecionar equipe gerenciada automaticamente
  useEffect(() => {
    if (!teamLoading && managedTeamId && !selectedTeamId) {
      setSelectedTeamId(managedTeamId);
    }
  }, [teamLoading, managedTeamId, selectedTeamId]);

  useEffect(() => {
    loadEquipes();
  }, []);

  const loadEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('id, nome, responsavel_nome')
        .order('nome');

      if (error) {
        console.error('Error loading equipes:', error);
      } else {
        setEquipes(data || []);
      }
    } catch (error) {
      console.error('Error loading equipes:', error);
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

    // Filtro de equipe
    let matchesTeam = true;
    if (selectedTeamId) {
      const originalLead = leads.find(l => l.id === lead.id);
      if (originalLead?.user?.equipe_id) {
        matchesTeam = originalLead.user.equipe_id === selectedTeamId;
      } else {
        matchesTeam = false;
      }
    }

    // Filtro de etapa
    const matchesStage = !selectedStage || lead.etapa === selectedStage;

    // Filtro de etiquetas
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

    // Filtro de data
    let matchesDate = true;
    if (dateFilter !== 'periodo-total') {
      const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);
      if (dateRange) {
        const leadDate = lead.dataCriacao;
        matchesDate = leadDate >= dateRange.from && leadDate <= dateRange.to;
      }
    }

    return matchesSearch && matchesUser && matchesTeam && matchesStage && matchesDate && matchesTags;
  });

  // Aplicar paginação - mostrar apenas os primeiros N leads
  const visibleLeads = filteredLeads.slice(0, visibleLeadsCount);
  const hasMoreLeads = filteredLeads.length > visibleLeadsCount;
  const remainingLeadsCount = filteredLeads.length - visibleLeadsCount;

  const handleLoadMore = () => {
    setVisibleLeadsCount(prev => prev + LEADS_PER_PAGE);
  };

  const handleLeadClick = (lead: Lead) => {
    navigate(`/lead/${lead.id}`);
  };

  const handleWhatsApp = async (telefone: string, e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    const cleanPhone = telefone.replace(/\D/g, '');
    
    // Registrar tentativa de contato via WhatsApp
    await registerContactAttempt(leadId, 'whatsapp', telefone);
    
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  // Função para registrar tentativa de contato
  const registerContactAttempt = async (leadId: string, type: string, telefone: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) return;

      // Buscar o lead atual para pegar as atividades existentes
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('atividades')
        .eq('id', leadId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar lead:', fetchError);
        return;
      }

      const contactActivity = {
        id: Date.now().toString(),
        tipo: type,
        descricao: `Tentativa de contato via ${type === 'whatsapp' ? 'WhatsApp' : type} para ${telefone}`,
        data: new Date().toISOString(),
        corretor: userData.user.user_metadata?.name || userData.user.email || 'Usuário não identificado'
      };

      const existingActivities = Array.isArray(leadData.atividades) ? leadData.atividades : [];
      const updatedActivities = [...existingActivities, contactActivity];

      const { error } = await supabase
        .from('leads')
        .update({ atividades: updatedActivities })
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao registrar tentativa de contato:', error);
      }
    } catch (error) {
      console.error('Erro geral ao registrar contato:', error);
    }
  };

  const handleCall = (telefone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${telefone}`, '_self');
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLeadFormData.nome.trim() || !newLeadFormData.telefone.trim()) {
      toast.error('Nome e Telefone são obrigatórios');
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsCreatingLead(true);

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          nome: newLeadFormData.nome,
          telefone: newLeadFormData.telefone,
          dados_adicionais: newLeadFormData.dadosAdicionais || null,
          etapa: 'aguardando-atendimento',
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        toast.error(`Erro ao criar lead: ${error.message}`);
        return;
      }

      toast.success('Lead criado com sucesso!');
      setNewLeadFormData({ nome: '', telefone: '', dadosAdicionais: '' });
      setIsNewLeadModalOpen(false);
      refreshLeads();
    } catch (error) {
      toast.error('Erro ao criar lead');
    } finally {
      setIsCreatingLead(false);
    }
  };

  const handleCloseNewLeadSheet = () => {
    setNewLeadFormData({ nome: '', telefone: '', dadosAdicionais: '' });
    setIsNewLeadModalOpen(false);
  };

  const handleStageChange = async (leadId: string, newStage: Lead['etapa']) => {
    await updateLeadOptimistic(leadId, { etapa: newStage });
  };

  if (loading || roleLoading || teamLoading || stagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
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
      <div className="min-h-screen bg-gray-50 dark:bg-background">
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
    <div className="min-h-screen bg-gray-50 pb-20 dark:bg-background">
      <MobileHeader title={quote} />

      {/* Banner de notificações */}
      <NotificationPromptBanner />

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
        <div className="bg-white rounded-lg p-4">
          {/* Botão para expandir/minimizar filtros */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </Button>

          {/* Conteúdo dos filtros */}
          {filtersExpanded && (
            <div className="space-y-4">
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
              
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrar por Equipe</span>
              </div>
              
              <Select
                value={selectedTeamId || "todas"}
                onValueChange={(value) => setSelectedTeamId(value === "todas" ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as equipes</SelectItem>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{equipe.nome}</span>
                        {equipe.responsavel_nome && (
                          <span className="text-xs text-muted-foreground">
                            Resp: {equipe.responsavel_nome}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrar por Etapa</span>
              </div>
              
              <Select
                value={selectedStage || "todas"}
                onValueChange={(value) => setSelectedStage(value === "todas" ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as etapas</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.nome}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: stage.cor }}
                        ></div>
                        {stage.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 mb-2 mt-4">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrar por Etiquetas</span>
              </div>
              
              <TagFilter
                selectedTagIds={selectedTagIds}
                onTagChange={setSelectedTagIds}
              />
            </div>
          )}
        </div>
      </div>


      {/* New Lead Button */}
      {canCreateLeads && (
        <div className="px-4 pb-4">
          <Button
            size="sm"
            onClick={() => setIsNewLeadModalOpen(true)}
            className="bg-primary hover:bg-primary/90 px-2 py-1 text-xs h-7"
          >
            <Plus className="w-3 h-3 mr-1" />
            Novo Lead
          </Button>
        </div>
      )}

      {/* Leads List */}
      <div className="px-4 space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum lead encontrado</p>
          </div>
        ) : (
          <>
            {visibleLeads.map((lead) => (
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
                      className="ml-2 h-auto p-1 text-xs border-none shadow-none"
                      style={{ 
                        backgroundColor: getStageColor(lead.etapa),
                        color: '#1f2937'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{getStageName(lead.etapa)}</span>
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.legacy_key || stage.nome} className="text-xs">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: stage.cor }}
                            ></div>
                            {stage.nome}
                          </div>
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
                <div className="text-xs text-muted-foreground">
                  <span>{lead.corretor}</span>
                  <span className="mx-1">•</span>
                  <span>{lead.dataCriacao.toLocaleDateString('pt-BR')}</span>
                </div>
                
                {/* Tags com cores corretas */}
                {lead.etiquetas && lead.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-w-full mt-2 justify-end">
                    {lead.etiquetas.map((etiqueta, index) => {
                      const isQualified = etiqueta === 'Lead Qualificado Pela IA';
                      return (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                            isQualified 
                              ? 'text-black text-[10px] shadow-lg border border-yellow-600' 
                              : 'text-white text-xs'
                          }`}
                          style={{
                            background: isQualified 
                              ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #B8860B 75%, #FFD700 100%)' 
                              : 'hsl(var(--tag-default))',
                            boxShadow: isQualified 
                              ? '0 2px 8px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                              : 'none'
                          }}
                        >
                          {etiqueta}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            ))}
            
            {/* Botão Ver Mais */}
            {hasMoreLeads && (
              <div className="py-4">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleLoadMore}
                >
                  Ver mais {Math.min(LEADS_PER_PAGE, remainingLeadsCount)} leads
                  <span className="ml-2 text-muted-foreground text-xs">
                    ({remainingLeadsCount} restantes)
                  </span>
                </Button>
              </div>
            )}
            
            {/* Indicador de fim da lista */}
            {!hasMoreLeads && filteredLeads.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Exibindo todos os {filteredLeads.length} leads
              </div>
            )}
          </>
        )}
      </div>

      {/* Sheet de Novo Lead no Topo */}
      {canCreateLeads && (
        <Sheet open={isNewLeadModalOpen} onOpenChange={handleCloseNewLeadSheet}>
          <SheetContent side="top" className="mx-3 mt-3 rounded-xl px-5 py-5 border shadow-lg">
            <SheetHeader className="pb-2">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Plus className="w-4 h-4" />
                Novo Lead
              </SheetTitle>
            </SheetHeader>
            
            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <Label htmlFor="nome" className="text-sm">Nome *</Label>
                <Input
                  id="nome"
                  value={newLeadFormData.nome}
                  onChange={(e) => setNewLeadFormData({ ...newLeadFormData, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="h-9"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone" className="text-sm">Telefone *</Label>
                <Input
                  id="telefone"
                  value={newLeadFormData.telefone}
                  onChange={(e) => setNewLeadFormData({ ...newLeadFormData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="h-9"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dadosAdicionais" className="text-sm">Dados Adicionais</Label>
                <textarea
                  id="dadosAdicionais"
                  value={newLeadFormData.dadosAdicionais}
                  onChange={(e) => setNewLeadFormData({ ...newLeadFormData, dadosAdicionais: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCloseNewLeadSheet}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isCreatingLead}>
                  {isCreatingLead ? 'Criando...' : 'Criar Lead'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}