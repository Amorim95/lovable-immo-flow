
import { useState } from "react";
import { Lead, LeadTag } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagSelector } from "@/components/TagSelector";
import { LeadTransferModal } from "@/components/LeadTransferModal";
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
  'tentando-financiamento': {
    label: 'Tentando Financiamento',
    className: 'tag-financiamento'
  },
  'parou-responder': {
    label: 'Parou de Responder',
    className: 'tag-sem-resposta'  
  },
  'cpf-restricao': {
    label: 'CPF Restrição',
    className: 'tag-cpf-restricao'
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
    
    // Registrar primeiro contato via WhatsApp se ainda não foi registrado
    await registerFirstContactWhatsApp(lead.id);
    
    // Registrar tentativa de contato via WhatsApp
    await registerContactAttempt(lead.id, 'whatsapp', telefone);
    
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  // Função para registrar o primeiro contato via WhatsApp
  const registerFirstContactWhatsApp = async (leadId: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Buscar o lead para verificar se já tem primeiro contato registrado
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('primeiro_contato_whatsapp')
        .eq('id', leadId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar lead:', fetchError);
        return;
      }

      // Se ainda não tem primeiro contato registrado, registrar agora
      if (!leadData.primeiro_contato_whatsapp) {
        const { error } = await supabase
          .from('leads')
          .update({ primeiro_contato_whatsapp: new Date().toISOString() })
          .eq('id', leadId);

        if (error) {
          console.error('Erro ao registrar primeiro contato WhatsApp:', error);
        }
      }
    } catch (error) {
      console.error('Erro geral ao registrar primeiro contato:', error);
    }
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
      className="lead-card cursor-pointer bg-white shadow-sm hover:shadow-md border border-gray-200"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Título do Lead */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-gray-500" />
            <h4 className="font-semibold text-gray-900 truncate">{lead.nome}</h4>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(lead.dataCriacao)}</span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{lead.dadosAdicionais || 'Sem informações adicionais'}</p>
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
            <span className="text-gray-600">Telefone:</span>
            <span className="font-medium text-gray-800">
              {lead.telefone}
            </span>
          </div>
        </div>

        {/* Corretor */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500">Corretor:</span>
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
        leadId={lead.id}
        leadName={lead.nome}
        currentOwnerId={userId || lead.id}
        currentOwnerName={lead.corretor}
        onTransferComplete={handleTransferComplete}
      />
    </Card>
  );
}
