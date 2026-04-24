
import { useState } from "react";
import { Lead, LeadTag } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagSelector } from "@/components/TagSelector";
import { LeadTransferModal } from "@/components/LeadTransferModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useLeadStages } from "@/hooks/useLeadStages";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, ArrowRightLeft, Users, X, ChevronDown, FolderSync } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ListViewProps {
  leads: (Lead & { userId?: string })[];
  onLeadClick: (lead: Lead) => void;
  onLeadUpdate: (leadId: string, updates: Partial<Lead>) => void;
  onOptimisticUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

const stageLabels = {
  'aguardando-atendimento': 'Aguardando Atendimento',
  'tentativas-contato': 'Em Tentativas de Contato',
  'atendeu': 'Atendeu',
  'nome-sujo': 'Nome Sujo',
  'nome-limpo': 'Nome Limpo',
  'visita': 'Visita',
  'vendas-fechadas': 'Vendas Fechadas',
  'em-pausa': 'Em Pausa',
  'descarte': 'Descarte'
};

const stageColors = {
  'aguardando-atendimento': 'bg-slate-100 text-slate-800',
  'tentativas-contato': 'bg-yellow-100 text-yellow-800',
  'atendeu': 'bg-blue-100 text-blue-800',
  'nome-sujo': 'bg-amber-100 text-amber-800',
  'nome-limpo': 'bg-teal-100 text-teal-800',
  'visita': 'bg-purple-100 text-purple-800',
  'vendas-fechadas': 'bg-green-100 text-green-800',
  'em-pausa': 'bg-orange-100 text-orange-800',
  'descarte': 'bg-red-100 text-red-800'
};

export function ListView({ leads, onLeadClick, onLeadUpdate, onOptimisticUpdate }: ListViewProps) {
  const { isAdmin, isGestor } = useUserRole();
  const { stages } = useLeadStages();
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(50);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkStageLoading, setBulkStageLoading] = useState(false);
  const [transferModalData, setTransferModalData] = useState<{
    isOpen: boolean;
    leadIds: string[];
    leadNames: string[];
    currentOwnerIds: string[];
    currentOwnerNames: string[];
  } | null>(null);
  
  const canTransfer = isAdmin || isGestor;
  const fallbackStages = Object.entries(stageLabels).map(([legacy_key, nome]) => ({
    id: legacy_key,
    nome,
    legacy_key,
  }));
  const availableStages = stages.length > 0 ? stages : fallbackStages;

  const resolveStageForLead = (lead: Lead) => {
    const matchedByName = stages.find(stage => stage.nome === lead.stage_name);
    if (matchedByName) return matchedByName;

    const matchedByLegacyStageName = stages.find(stage => stage.legacy_key && stage.legacy_key === lead.stage_name);
    if (matchedByLegacyStageName) return matchedByLegacyStageName;

    const matchedByEtapa = stages.find(stage => stage.legacy_key && stage.legacy_key === lead.etapa);
    if (matchedByEtapa) return matchedByEtapa;

    return fallbackStages.find(stage => stage.legacy_key === lead.etapa || stage.legacy_key === lead.stage_name);
  };
  
  // Limitar leads visíveis para performance
  const visibleLeads = leads.slice(0, visibleCount);
  const hasMoreLeads = leads.length > visibleCount;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleWhatsAppClick = async (telefone: string, e: React.MouseEvent, leadId: string) => {
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
        .select('atividades, primeiro_contato_whatsapp')
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

      // Update atômico: atividades + primeiro_contato_whatsapp juntos
      const updateData: any = { atividades: updatedActivities };
      if (type === 'whatsapp' && !leadData.primeiro_contato_whatsapp) {
        updateData.primeiro_contato_whatsapp = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao registrar tentativa de contato:', error);
      }
    } catch (error) {
      console.error('Erro geral ao registrar contato:', error);
    }
  };

  const handleTagsChange = (leadId: string, newTags: LeadTag[]) => {
    onLeadUpdate(leadId, { etiquetas: newTags });
  };

  const handleStageChange = (leadId: string, selectedValue: string) => {
    const selectedStage = stages.find(stage => stage.nome === selectedValue || stage.legacy_key === selectedValue);

    if (selectedStage) {
      onLeadUpdate(leadId, {
        stage_name: selectedStage.nome,
        etapa: (selectedStage.legacy_key || selectedValue) as Lead['etapa'],
      });
      return;
    }

    onLeadUpdate(leadId, { etapa: selectedValue as Lead['etapa'] });
  };

  const handleCorretorClick = (lead: Lead & { userId?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    if (canTransfer) {
      setTransferModalData({
        isOpen: true,
        leadIds: [lead.id],
        leadNames: [lead.nome],
        currentOwnerIds: [lead.userId || lead.id],
        currentOwnerNames: [lead.corretor]
      });
    }
  };

  const handleTransferComplete = (newUserId?: string, newUserName?: string) => {
    if (transferModalData && newUserId && newUserName && onOptimisticUpdate) {
      // Atualizar todos os leads transferidos
      transferModalData.leadIds.forEach(leadId => {
        onOptimisticUpdate(leadId, { 
          userId: newUserId, 
          corretor: newUserName 
        });
      });
    }
    setTransferModalData(null);
    setSelectedLeadIds([]); // Limpar seleção após transferência
  };

  const allVisibleSelected = visibleLeads.length > 0 && visibleLeads.every(l => selectedLeadIds.includes(l.id));
  const someVisibleSelected = visibleLeads.some(l => selectedLeadIds.includes(l.id)) && !allVisibleSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Seleciona os primeiros 50 visíveis
      const first50 = visibleLeads.slice(0, 50).map(l => l.id);
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...first50])));
    } else {
      const visibleIds = new Set(visibleLeads.map(l => l.id));
      setSelectedLeadIds(prev => prev.filter(id => !visibleIds.has(id)));
    }
    setLastSelectedIndex(null);
  };

  const handleSelectLead = (leadId: string, checked: boolean, index: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click: seleciona intervalo
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = visibleLeads.slice(start, end + 1).map(l => l.id);
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...rangeIds])));
    } else {
      if (checked) {
        setSelectedLeadIds(prev => [...prev, leadId]);
      } else {
        setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
      }
      setLastSelectedIndex(index);
    }
  };

  const handleBulkTransfer = () => {
    const selectedLeads = leads.filter(lead => selectedLeadIds.includes(lead.id));
    setTransferModalData({
      isOpen: true,
      leadIds: selectedLeads.map(lead => lead.id),
      leadNames: selectedLeads.map(lead => lead.nome),
      currentOwnerIds: selectedLeads.map(lead => lead.userId || lead.id),
      currentOwnerNames: selectedLeads.map(lead => lead.corretor)
    });
  };

  const handleBulkStageChange = async (stageName: string) => {
    if (selectedLeadIds.length === 0) return;
    setBulkStageLoading(true);
    try {
      const stage = stages.find(s => s.nome === stageName);
      const legacyKey = stage?.legacy_key || 'aguardando-atendimento';
      
      // Update in batches of 50
      for (let i = 0; i < selectedLeadIds.length; i += 50) {
        const batch = selectedLeadIds.slice(i, i + 50);
        const { error } = await supabase
          .from('leads')
          .update({ 
            stage_name: stageName,
            etapa: legacyKey as any,
          })
          .in('id', batch);
        if (error) throw error;
      }

      // Optimistic update
      if (onOptimisticUpdate) {
        selectedLeadIds.forEach(id => {
          onOptimisticUpdate(id, { 
            stage_name: stageName,
            etapa: legacyKey as any,
          });
        });
      }

      toast.success(`${selectedLeadIds.length} lead(s) movido(s) para "${stageName}"`);
      setSelectedLeadIds([]);
    } catch (err: any) {
      console.error('Erro ao mover leads:', err);
      toast.error('Erro ao mover leads de etapa');
    } finally {
      setBulkStageLoading(false);
    }
  };

  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canTransfer && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) (el as any).indeterminate = someVisibleSelected;
                    }}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos os leads visíveis"
                    title="Selecionar os primeiros 50 leads"
                  />
                </TableHead>
              )}
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Etiquetas</TableHead>
              <TableHead>Corretor</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
            {visibleLeads.map((lead, index) => {
              const resolvedStage = resolveStageForLead(lead);
              const selectValue = resolvedStage?.nome || lead.stage_name || lead.etapa;

              return (
              <TableRow
                key={lead.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedLeadIds.includes(lead.id) ? 'bg-primary/5 hover:bg-primary/10' : ''
                }`}
                onClick={() => onLeadClick(lead)}
              >
                {canTransfer && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLeadIds.includes(lead.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isCurrentlySelected = selectedLeadIds.includes(lead.id);
                        handleSelectLead(lead.id, !isCurrentlySelected, index, e as React.MouseEvent);
                      }}
                      aria-label={`Selecionar ${lead.nome}`}
                    />
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">{formatDate(lead.dataCriacao)}</TableCell>
                <TableCell className="font-medium">{lead.nome}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                   value={selectValue}
                   onValueChange={(value) => handleStageChange(lead.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {availableStages.map(stage => (
                       <SelectItem key={stage.id} value={stage.nome}>
                         {stage.nome}
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <TagSelector
                  selectedTags={lead.etiquetas}
                  onTagsChange={(newTags) => handleTagsChange(lead.id, newTags)}
                  variant="compact"
                />
              </TableCell>
              <TableCell>
                <div 
                  className={`flex items-center gap-1 ${canTransfer ? 'cursor-pointer hover:bg-muted/50 rounded p-1 -m-1' : ''}`}
                  onClick={(e) => handleCorretorClick(lead, e)}
                  title={canTransfer ? 'Clique para transferir lead' : undefined}
                >
                  <span>{lead.corretor}</span>
                  {canTransfer && (
                    <ArrowRightLeft className="w-3 h-3 text-muted-foreground ml-1" />
                  )}
                </div>
              </TableCell>
            </TableRow>
          );})}
        </TableBody>
      </Table>
      
      {/* Botão Ver Mais */}
      {hasMoreLeads && (
        <div className="flex justify-center py-4 border-t">
          <Button
            variant="outline"
            onClick={() => setVisibleCount(prev => prev + 50)}
            className="gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Ver mais ({leads.length - visibleCount} restantes)
          </Button>
        </div>
      )}
      
      {/* Contador de leads */}
      <div className="flex justify-between items-center py-3 px-4 border-t text-sm text-muted-foreground">
        <span>Exibindo {visibleLeads.length} de {leads.length} leads</span>
      </div>
      
        {/* Modal de Transferência */}
        {transferModalData && (
          <LeadTransferModal
            isOpen={transferModalData.isOpen}
            onClose={() => {
              setTransferModalData(null);
              setSelectedLeadIds([]);
            }}
            leadIds={transferModalData.leadIds}
            leadNames={transferModalData.leadNames}
            currentOwnerIds={transferModalData.currentOwnerIds}
            currentOwnerNames={transferModalData.currentOwnerNames}
            onTransferComplete={handleTransferComplete}
          />
        )}
      </div>

      {/* Barra de Ações Flutuante */}
      {canTransfer && selectedLeadIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto flex items-center justify-between max-w-7xl">
            <div className="flex items-center gap-4">
              <Users className="w-5 h-5" />
              <span className="font-semibold">
                {selectedLeadIds.length} lead{selectedLeadIds.length !== 1 ? 's' : ''} selecionado{selectedLeadIds.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setSelectedLeadIds([])}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Select onValueChange={handleBulkStageChange} disabled={bulkStageLoading}>
                <SelectTrigger className="w-[180px] bg-white text-primary border-white/20 h-9">
                  <FolderSync className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Mover de Etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.nome}>{stage.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleBulkTransfer}
                className="bg-white text-primary hover:bg-white/90"
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transferir Lead{selectedLeadIds.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
