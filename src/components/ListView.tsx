
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
import { TagSelector } from "@/components/TagSelector";
import { Phone } from "lucide-react";

interface ListViewProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onLeadUpdate: (leadId: string, updates: Partial<Lead>) => void;
}

const stageLabels = {
  'aguardando-atendimento': 'Aguardando Atendimento',
  'tentativas-contato': 'Em Tentativas de Contato',
  'atendeu': 'Atendeu',
  'visita': 'Visita',
  'vendas-fechadas': 'Vendas Fechadas',
  'em-pausa': 'Em Pausa'
};

const stageColors = {
  'aguardando-atendimento': 'bg-slate-100 text-slate-800',
  'tentativas-contato': 'bg-yellow-100 text-yellow-800',
  'atendeu': 'bg-blue-100 text-blue-800',
  'visita': 'bg-purple-100 text-purple-800',
  'vendas-fechadas': 'bg-green-100 text-green-800',
  'em-pausa': 'bg-orange-100 text-orange-800'
};

export function ListView({ leads, onLeadClick, onLeadUpdate }: ListViewProps) {
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

  const handleTagsChange = (leadId: string, newTags: LeadTag[]) => {
    onLeadUpdate(leadId, { etiquetas: newTags });
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleWhatsAppClick(lead.telefone, e)}
                  >
                    <Phone className="w-3 h-3 text-green-600" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {lead.dadosAdicionais || '-'}
              </TableCell>
              <TableCell>
                <Badge className={stageColors[lead.etapa]}>
                  {stageLabels[lead.etapa]}
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <TagSelector
                  selectedTags={lead.etiquetas}
                  onTagsChange={(newTags) => handleTagsChange(lead.id, newTags)}
                  variant="compact"
                />
              </TableCell>
              <TableCell>{lead.corretor}</TableCell>
              <TableCell>{formatDate(lead.dataCriacao)}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleWhatsAppClick(lead.telefone, e)}
                >
                  <Phone className="w-3 h-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
