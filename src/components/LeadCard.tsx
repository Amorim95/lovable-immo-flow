import { Lead, LeadTag } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, User, Calendar } from "lucide-react";

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
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleWhatsAppClick = (telefone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
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
          <p className="text-sm font-medium text-primary truncate">{lead.imovel}</p>
        </div>

        {/* Etiquetas */}
        {lead.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {lead.etiquetas.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={`text-xs px-2 py-1 ${tagConfig[tag].className}`}
              >
                {tagConfig[tag].label}
              </Badge>
            ))}
          </div>
        )}

        {/* Informações principais */}
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Renda:</span>
            <span className="font-medium">
              {lead.rendaFamiliar.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">FGTS:</span>
            <span className={`font-medium ${lead.temFGTS ? 'text-green-600' : 'text-red-600'}`}>
              {lead.temFGTS ? 'Sim' : 'Não'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Entrada:</span>
            <span className={`font-medium ${lead.possuiEntrada ? 'text-green-600' : 'text-red-600'}`}>
              {lead.possuiEntrada ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>

        {/* Corretor */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500">Corretor:</span>
          <Badge variant="outline" className="text-xs">
            {lead.corretor}
          </Badge>
        </div>

        {/* Botões de ação */}
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
          {lead.telefoneExtra && (
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={(e) => handleWhatsAppClick(lead.telefoneExtra!, e)}
            >
              <Phone className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
