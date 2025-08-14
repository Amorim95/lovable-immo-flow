import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lead, Atividade } from "@/types/crm";
import { useLeadsOptimized } from "@/hooks/useLeadsOptimized";
import { useAuth } from "@/contexts/AuthContext";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, MessageCircle, History, Plus, Clock, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { leads, updateLeadOptimistic } = useLeadsOptimized();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    dadosAdicionais: '',
    etapa: 'aguardando-atendimento' as Lead['etapa']
  });
  const [newActivity, setNewActivity] = useState('');

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
          etiquetas: foundLead.lead_tag_relations?.map(rel => rel.lead_tags?.nome as Lead['etiquetas'][0]).filter(Boolean) || [],
          corretor: foundLead.user?.name || 'Não atribuído',
          atividades: (Array.isArray(foundLead.atividades) ? foundLead.atividades : []).map((atividade: any) => ({
            id: atividade.id,
            tipo: atividade.tipo as Atividade['tipo'],
            descricao: atividade.descricao,
            data: new Date(atividade.data),
            corretor: atividade.corretor
          })),
          status: 'ativo'
        };
        setLead(convertedLead);
        setFormData({
          nome: convertedLead.nome,
          telefone: convertedLead.telefone,
          dadosAdicionais: convertedLead.dadosAdicionais,
          etapa: convertedLead.etapa
        });

        // Registrar visualização do lead
        registerLeadView(convertedLead);
      }
    }
  }, [id, leads]);

  // Função para registrar visualização do lead
  const registerLeadView = async (leadData: Lead) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) return;

      const userName = userData.user.user_metadata?.name || userData.user.email || 'Usuário não identificado';

      // Verificar se já existe uma visualização recente (últimos 5 minutos) do mesmo usuário
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentViewByUser = leadData.atividades?.find(atividade => 
        atividade.tipo === 'observacao' && 
        atividade.descricao === 'Lead visualizado' &&
        atividade.corretor === userName &&
        new Date(atividade.data) > fiveMinutesAgo
      );

      // Se já visualizou recentemente, não registrar novamente
      if (recentViewByUser) {
        console.log('Visualização já registrada nos últimos 5 minutos');
        return;
      }

      console.log('Registrando visualização do lead por:', userName);

      const viewActivity: Atividade = {
        id: Date.now().toString(),
        tipo: 'observacao',
        descricao: `Lead visualizado`,
        data: new Date(),
        corretor: userName
      };

      const updatedActivities = [...(leadData.atividades || []), viewActivity];
      
      // Converter atividades para formato JSON correto
      const atividadesJson = updatedActivities.map(atividade => ({
        id: atividade.id,
        tipo: atividade.tipo,
        descricao: atividade.descricao,
        data: atividade.data instanceof Date ? atividade.data.toISOString() : atividade.data,
        corretor: atividade.corretor
      }));

      const { error } = await supabase
        .from('leads')
        .update({ atividades: atividadesJson })
        .eq('id', leadData.id);

      if (!error) {
        console.log('Visualização registrada com sucesso');
        // Atualizar estado local
        setLead(prev => prev ? { 
          ...prev, 
          atividades: updatedActivities
        } : null);
      } else {
        console.error('Erro ao registrar visualização:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

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

  const handleWhatsApp = async () => {
    if (!lead?.telefone) return;
    
    const cleanPhone = lead.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    
    // Registrar atividade de contato
    try {
      const activity: Atividade = {
        id: Date.now().toString(),
        tipo: 'whatsapp',
        descricao: `Tentativa de contato via WhatsApp`,
        data: new Date(),
        corretor: user?.name || 'Usuário não identificado'
      };

      const updatedActivities = [...(lead.atividades || []), activity];
      
      // Converter atividades para formato JSON correto
      const atividadesJson = updatedActivities.map(atividade => ({
        id: atividade.id,
        tipo: atividade.tipo,
        descricao: atividade.descricao,
        data: atividade.data instanceof Date ? atividade.data.toISOString() : atividade.data,
        corretor: atividade.corretor
      }));

      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('leads')
        .update({ atividades: atividadesJson })
        .eq('id', lead.id);

      if (error) {
        console.error('Erro ao salvar atividade de contato:', error);
      } else {
        // Atualizar estado local
        setLead(prev => prev ? { 
          ...prev, 
          atividades: updatedActivities
        } : null);
      }
    } catch (error) {
      console.error('Erro geral:', error);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.trim() || !lead) return;
    
    try {
      const activity: Atividade = {
        id: Date.now().toString(),
        tipo: 'observacao',
        descricao: newActivity,
        data: new Date(),
        corretor: user?.name || 'Usuário não identificado'
      };

      const updatedActivities = [...(lead.atividades || []), activity];
      
      // Converter atividades para formato JSON correto
      const atividadesJson = updatedActivities.map(atividade => ({
        id: atividade.id,
        tipo: atividade.tipo,
        descricao: atividade.descricao,
        data: atividade.data instanceof Date ? atividade.data.toISOString() : atividade.data,
        corretor: atividade.corretor
      }));

      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('leads')
        .update({ atividades: atividadesJson })
        .eq('id', lead.id);

      if (error) {
        console.error('Erro ao salvar atividade:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar atividade."
        });
        return;
      }

      // Atualizar estado local
      setLead(prev => prev ? { 
        ...prev, 
        atividades: updatedActivities
      } : null);
      
      toast({
        title: "Atividade adicionada",
        description: "A atividade foi registrada com sucesso."
      });
      setNewActivity('');
    } catch (error) {
      console.error('Erro geral:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar atividade."
      });
    }
  };

  const handleCopyDadosAdicionais = async () => {
    try {
      const dadosAdicionais = formData.dadosAdicionais || '';
      await navigator.clipboard.writeText(dadosAdicionais);
      toast({
        title: "Copiado!",
        description: "Dados adicionais copiados para a área de transferência."
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: "Erro",
        description: "Erro ao copiar dados."
      });
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
            onClick={handleWhatsApp}
            className="flex-1 bg-green-500 hover:bg-green-600"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button 
            onClick={() => setShowActivities(!showActivities)}
            variant="outline"
            className="flex-1"
          >
            <History className="w-4 h-4 mr-2" />
            Histórico
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="dados">Dados Adicionais</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDadosAdicionais}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
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

        {/* Histórico de Atividades */}
        {showActivities && (
          <div className="bg-white rounded-lg p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Atividades
            </h2>
            
            {/* Nova Atividade */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Adicionar nova atividade..."
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button
                  onClick={handleAddActivity}
                  disabled={!newActivity.trim()}
                  className="h-fit"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Lista de Atividades */}
            <div className="space-y-3">
              {lead.atividades && lead.atividades.length > 0 ? (
                lead.atividades.map((atividade, index) => (
                  <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{atividade.descricao}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(atividade.data).toLocaleString('pt-BR')} • {atividade.corretor}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Nenhuma atividade registrada ainda</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}