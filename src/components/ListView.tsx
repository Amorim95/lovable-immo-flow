
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
import { Phone, ArrowRightLeft } from "lucide-react";

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
  'visita': 'Visita',
  'vendas-fechadas': 'Vendas Fechadas',
  'em-pausa': 'Em Pausa',
  'descarte': 'Descarte'
};

const stageColors = {
  'aguardando-atendimento': 'bg-slate-100 text-slate-800',
  'tentativas-contato': 'bg-yellow-100 text-yellow-800',
  'atendeu': 'bg-blue-100 text-blue-800',
  'visita': 'bg-purple-100 text-purple-800',
  'vendas-fechadas': 'bg-green-100 text-green-800',
  'em-pausa': 'bg-orange-100 text-orange-800',
  'descarte': 'bg-red-100 text-red-800'
};

export function ListView({ leads, onLeadClick, onLeadUpdate, onOptimisticUpdate }: ListViewProps) {
  const { isAdmin, isGestor } = useUserRole();
  const [transferModalData, setTransferModalData] = useState<{
    isOpen: boolean;
    leadId: string;
    leadName: string;
    currentOwnerId: string;
    currentOwnerName: string;
  } | null>(null);
  
  const canTransfer = isAdmin || isGestor;
  
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
        leadId: lead.id,
        leadName: lead.nome,
        currentOwnerId: lead.userId || lead.id,
        currentOwnerName: lead.corretor
      });
    }
  };

  const handleTransferComplete = (newUserId?: string, newUserName?: string) => {
    if (transferModalData && newUserId && newUserName && onOptimisticUpdate) {
      onOptimisticUpdate(transferModalData.leadId, { 
        userId: newUserId, 
        corretor: newUserName 
      });
    }
    setTransferModalData(null);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Dados Adicionais</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Etiquetas</TableHead>
            <TableHead>Corretor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onLeadClick(lead)}
            >
              <TableCell className="font-medium">{lead.nome}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{lead.telefone}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {lead.dadosAdicionais || '-'}
              </TableCell>
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
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="vendas-fechadas">Vendas Fechadas</SelectItem>
                    <SelectItem value="em-pausa">Em Pausa</SelectItem>
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
              <TableCell>{formatDate(lead.dataCriacao)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Modal de Transferência */}
      {transferModalData && (
        <LeadTransferModal
          isOpen={transferModalData.isOpen}
          onClose={() => setTransferModalData(null)}
          leadId={transferModalData.leadId}
          leadName={transferModalData.leadName}
          currentOwnerId={transferModalData.currentOwnerId}
          currentOwnerName={transferModalData.currentOwnerName}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </div>
  );
}
