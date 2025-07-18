
import { useState } from "react";
import { Lead, LeadTag } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagSelector } from "@/components/TagSelector";
import { CorretorSelector } from "@/components/CorretorSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Phone, User, Calendar, ArrowRightLeft } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  onUpdate: (updates: Partial<Lead>) => void;
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

export function LeadCard({ lead, onClick, onUpdate }: LeadCardProps) {
  const [isCorretorSelectorOpen, setIsCorretorSelectorOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isGestor } = useUserRole();

  // Pode transferir lead se for admin ou gestor
  const canTransferLead = isAdmin || isGestor;

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

  const handleWhatsAppClick = (telefone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const handleTagsChange = (newTags: LeadTag[]) => {
    onUpdate({ etiquetas: newTags });
  };

  const handleTransferLead = async (newUserId: string, newUserName: string) => {
    console.log('LeadCard - Iniciando transferência:', { 
      leadId: lead.id, 
      currentCorretor: lead.corretor, 
      newUserId, 
      newUserName 
    });

    try {
      // Atualizar o lead no banco de dados
      const { data, error } = await supabase
        .from('leads')
        .update({ user_id: newUserId })
        .eq('id', lead.id)
        .select();

      console.log('LeadCard - Resultado da atualização:', { data, error });

      if (error) throw error;

      // Atualizar o lead localmente
      onUpdate({ corretor: newUserName });

      console.log('LeadCard - Lead atualizado localmente');

      toast({
        title: "Transferência realizada",
        description: `Lead transferido com sucesso para ${newUserName}`,
      });
    } catch (error) {
      console.error('LeadCard - Erro completo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível transferir o lead. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCorretorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canTransferLead) {
      setIsCorretorSelectorOpen(true);
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
          <Badge 
            variant="outline" 
            className={`text-xs ${canTransferLead ? "cursor-pointer hover:bg-blue-50 hover:border-blue-300" : ""}`}
            onClick={handleCorretorClick}
            title={canTransferLead ? "Clique para transferir o lead" : ""}
          >
            <span className="flex items-center gap-1">
              {lead.corretor}
              {canTransferLead && (
                <ArrowRightLeft className="w-3 h-3" />
              )}
            </span>
          </Badge>
        </div>

        {/* Botão de ação único */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => handleWhatsAppClick(lead.telefone, e)}
          >
            <Phone className="w-3 h-3 mr-1" />
            WhatsApp
          </Button>
        </div>
      </CardContent>

      {/* Modal de Seleção de Corretor */}
      <CorretorSelector
        isOpen={isCorretorSelectorOpen}
        onClose={() => setIsCorretorSelectorOpen(false)}
        onSelect={handleTransferLead}
        currentCorretorName={lead.corretor}
      />
    </Card>
  );
}
