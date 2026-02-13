
import { useState } from "react";
import { Lead, LeadTag } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagSelector } from "@/components/TagSelector";
import { LeadTransferModal } from "@/components/LeadTransferModal";
import { RepiqueBadge } from "@/components/RepiqueBadge";
import { useUserRole } from "@/hooks/useUserRole";
import { Phone, User, Calendar, ArrowRightLeft } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  onUpdate: (updates: Partial<Lead>) => void;
  userId?: string; // ID do usuário proprietário do lead
  onOptimisticUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

const tagConfig: Record<LeadTag, { label: string; className: string }> = {
  'Lead Qualificado Pela IA': {
    label: 'Lead Qualificado Pela IA',
    className: 'tag-qualificado'
  },
  'Não Qualificado': {
    label: 'Não Qualificado',
    className: 'tag-nao-qualificado'
  }
};

export function LeadCard({ lead, onClick, onUpdate, userId, onOptimisticUpdate }: LeadCardProps) {
  const { isAdmin, isGestor } = useUserRole();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
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

  const handleWhatsAppClick = async (telefone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = telefone.replace(/\D/g, '');
    
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    
    // Registrar primeiro contato E atividade em uma ÚNICA chamada atômica
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) return;

      // Buscar lead com ambos os campos necessários
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('atividades, primeiro_contato_whatsapp')
        .eq('id', lead.id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar lead:', fetchError);
        return;
      }

      const contactActivity = {
        id: Date.now().toString(),
        tipo: 'whatsapp',
        descricao: `Tentativa de contato via WhatsApp`,
        data: new Date().toISOString(),
        corretor: userData.user.user_metadata?.name || userData.user.email || 'Usuário não identificado'
      };

      const existingActivities = Array.isArray(leadData.atividades) ? leadData.atividades : [];
      const updatedActivities = [...existingActivities, contactActivity];

      // Update atômico: atividades + primeiro_contato_whatsapp juntos
      const updateData: any = { atividades: updatedActivities };
      if (!leadData.primeiro_contato_whatsapp) {
        updateData.primeiro_contato_whatsapp = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id);

      if (error) {
        console.error('Erro ao registrar contato WhatsApp:', error);
      }
    } catch (error) {
      console.error('Erro geral ao registrar contato:', error);
    }
  };

  const handleTagsChange = (newTags: LeadTag[]) => {
    onUpdate({ etiquetas: newTags });
  };

  const handleCorretorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canTransfer) {
      setIsTransferModalOpen(true);
    }
  };

  const handleTransferComplete = (newUserId?: string, newUserName?: string) => {
    // Fechar modal
    setIsTransferModalOpen(false);
    // Atualizar dados localmente para exibição imediata
    if (newUserId && newUserName && onOptimisticUpdate) {
      onOptimisticUpdate(lead.id, { 
        userId: newUserId, 
        corretor: newUserName 
      });
    }
  };

  return (
    <Card 
      className="lead-card cursor-pointer bg-card shadow-sm hover:shadow-md border"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Título do Lead */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold text-foreground truncate">{lead.nome}</h4>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(lead.dataCriacao)}</span>
            {(lead as any).repiqueCount > 0 && (
              <RepiqueBadge count={(lead as any).repiqueCount} />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{lead.dadosAdicionais || 'Sem informações adicionais'}</p>
        </div>

        {/* Seletor de Etiquetas */}
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <TagSelector
            selectedTags={lead.etiquetas}
            onTagsChange={handleTagsChange}
            variant="compact"
          />
        </div>

        {/* Telefone */}
        <div className="mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Telefone:</span>
            <span className="font-medium text-foreground">
              {lead.telefone}
            </span>
          </div>
        </div>

        {/* Corretor */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-muted-foreground">Corretor:</span>
          <div
            className={`flex items-center gap-1 ${canTransfer ? 'cursor-pointer hover:bg-muted/50 rounded p-1 -m-1' : ''}`}
            onClick={handleCorretorClick}
            title={canTransfer ? 'Clique para transferir lead' : undefined}
          >
            <Badge variant="outline" className="text-xs">
              {lead.corretor}
            </Badge>
            {canTransfer && (
              <ArrowRightLeft className="w-3 h-3 text-muted-foreground ml-1" />
            )}
          </div>
        </div>

        {/* Telefone apenas para exibição */}
      </CardContent>
      
      {/* Modal de Transferência */}
      <LeadTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        leadIds={[lead.id]}
        leadNames={[lead.nome]}
        currentOwnerIds={[userId || lead.id]}
        currentOwnerNames={[lead.corretor]}
        onTransferComplete={handleTransferComplete}
      />
    </Card>
  );
}
