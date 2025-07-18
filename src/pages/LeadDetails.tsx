import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lead } from "@/types/crm";
import { useLeadsOptimized } from "@/hooks/useLeadsOptimized";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Phone, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const stageLabels = {
  'aguardando-atendimento': 'Aguardando Atendimento',
  'tentativas-contato': 'Em Tentativas de Contato', 
  'atendeu': 'Atendeu',
  'visita': 'Visita',
  'vendas-fechadas': 'Vendas Fechadas',
  'em-pausa': 'Em Pausa'
};

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, updateLeadOptimistic } = useLeadsOptimized();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    dadosAdicionais: '',
    etapa: 'aguardando-atendimento' as Lead['etapa']
  });

  useEffect(() => {
    if (id && leads.length > 0) {
      const foundLead = leads.find(l => l.id === id);
      if (foundLead) {
        const convertedLead: Lead = {
          id: foundLead.id,
          nome: foundLead.nome,
          telefone: foundLead.telefone,
          dadosAdicionais: foundLead.dados_adicionais || '',
          campanha: 'Não especificada',
          conjunto: 'Não especificado',
          anuncio: 'Não especificado',
          dataCriacao: new Date(foundLead.created_at),
          etapa: foundLead.etapa as Lead['etapa'],
          etiquetas: foundLead.lead_tag_relations?.map(rel => rel.lead_tags.nome as Lead['etiquetas'][0]) || [],
          corretor: foundLead.user?.name || 'Não atribuído',
          atividades: [],
          status: 'ativo'
        };
        setLead(convertedLead);
        setFormData({
          nome: convertedLead.nome,
          telefone: convertedLead.telefone,
          dadosAdicionais: convertedLead.dadosAdicionais,
          etapa: convertedLead.etapa
        });
      }
    }
  }, [id, leads]);

  const handleSave = async () => {
    if (!lead) return;
    
    const success = await updateLeadOptimistic(lead.id, {
      nome: formData.nome,
      telefone: formData.telefone,
      dadosAdicionais: formData.dadosAdicionais,
      etapa: formData.etapa
    });

    if (success) {
      setLead(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      toast({
        title: "Lead atualizado",
        description: "As informações do lead foram atualizadas com sucesso."
      });
    }
  };

  const handleWhatsApp = () => {
    if (lead?.telefone) {
      const cleanPhone = lead.telefone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    }
  };

  const handleCall = () => {
    if (lead?.telefone) {
      window.open(`tel:${lead.telefone}`, '_self');
    }
  };

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader 
          title="Carregando..." 
          showBackButton 
          onBack={() => navigate('/')} 
        />
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader
        title={lead.nome}
        showBackButton
        onBack={() => navigate('/')}
        rightElement={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="p-2"
          >
            <Edit className="w-5 h-5" />
          </Button>
        }
      />

      <div className="p-4 space-y-6">
        {/* Contact Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={handleCall}
            className="flex-1 bg-blue-500 hover:bg-blue-600"
          >
            <Phone className="w-4 h-4 mr-2" />
            Ligar
          </Button>
          <Button 
            onClick={handleWhatsApp}
            className="flex-1 bg-green-500 hover:bg-green-600"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>

        {/* Lead Information */}
        <div className="bg-white rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Informações do Lead</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="etapa">Etapa</Label>
              <Select
                value={formData.etapa}
                onValueChange={(value) => setFormData(prev => ({ ...prev, etapa: value as Lead['etapa'] }))}
                disabled={!isEditing}
              >
                <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dados">Dados Adicionais</Label>
              <Textarea
                id="dados"
                value={formData.dadosAdicionais}
                onChange={(e) => setFormData(prev => ({ ...prev, dadosAdicionais: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                rows={4}
                placeholder="Informações extras sobre o lead..."
              />
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Corretor:</strong> {lead.corretor}</p>
              <p><strong>Data de Criação:</strong> {lead.dataCriacao.toLocaleDateString('pt-BR')}</p>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave}
                  className="flex-1"
                >
                  Salvar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      nome: lead.nome,
                      telefone: lead.telefone,
                      dadosAdicionais: lead.dadosAdicionais,
                      etapa: lead.etapa
                    });
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}