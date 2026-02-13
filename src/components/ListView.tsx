
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
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, ArrowRightLeft, Users, X, ChevronDown } from "lucide-react";

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
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(50);
  const [transferModalData, setTransferModalData] = useState<{
    isOpen: boolean;
    leadIds: string[];
    leadNames: string[];
    currentOwnerIds: string[];
    currentOwnerNames: string[];
  } | null>(null);
  
  const canTransfer = isAdmin || isGestor;
  
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

  const handleStageChange = (leadId: string, newStage: Lead['etapa']) => {
    onLeadUpdate(leadId, { etapa: newStage });
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

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(prev => [...prev, leadId]);
    } else {
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
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

  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canTransfer && (
                <TableHead className="w-12">
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
            {visibleLeads.map((lead) => (
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
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      aria-label={`Selecionar ${lead.nome}`}
                    />
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">{formatDate(lead.dataCriacao)}</TableCell>
                <TableCell className="font-medium">{lead.nome}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                  value={lead.etapa}
                  onValueChange={(value) => handleStageChange(lead.id, value as Lead['etapa'])}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aguardando-atendimento">Aguardando Atendimento</SelectItem>
                    <SelectItem value="tentativas-contato">Em Tentativas de Contato</SelectItem>
                    <SelectItem value="atendeu">Atendeu</SelectItem>
                    <SelectItem value="nome-sujo">Nome Sujo</SelectItem>
                    <SelectItem value="nome-limpo">Nome Limpo</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="vendas-fechadas">Vendas Fechadas</SelectItem>
                    <SelectItem value="em-pausa">Em Pausa</SelectItem>
                    <SelectItem value="descarte">Descarte</SelectItem>
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
          ))}
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
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setSelectedLeadIds([])}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
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
