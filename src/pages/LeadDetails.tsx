import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lead, Atividade } from "@/types/crm";
import { useLeadById } from "@/hooks/useLeadById";
import { useAuth } from "@/contexts/AuthContext";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, MessageCircle, History, Plus, Clock, Copy, Tag } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TagSelector } from "@/components/TagSelector";
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
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  // Busca direta do lead pelo ID - muito mais rápido!
  const {
    lead,
    loading: leadLoading,
    updateLead,
    refreshLead
  } = useLeadById(id);
  const [isEditing, setIsEditing] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    dadosAdicionais: '',
    etapa: 'aguardando-atendimento' as Lead['etapa']
  });
  const [newActivity, setNewActivity] = useState('');

  // Atualizar formData quando lead carregar
  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome,
        telefone: lead.telefone,
        dadosAdicionais: lead.dadosAdicionais || '',
        etapa: lead.etapa
      });

      // Registrar visualização do lead
      registerLeadView(lead);
    }
  }, [lead]);

  // Função para registrar visualização do lead
  const registerLeadView = async (leadData: Lead) => {
    try {
      const {
        supabase
      } = await import('@/integrations/supabase/client');
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (!userData.user) return;
      const userName = userData.user.user_metadata?.name || userData.user.email || 'Usuário não identificado';

      // Marcar primeira visualização se ainda não foi marcada
      if (!leadData.primeira_visualizacao) {
        const {
          error: updateError
        } = await supabase.from('leads').update({
          primeira_visualizacao: new Date().toISOString()
        }).eq('id', leadData.id);
        if (updateError) {
          console.error('Erro ao marcar primeira visualização:', updateError);
        }
      }

      // Verificar se já existe uma visualização recente (últimos 5 minutos) do mesmo usuário
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentViewByUser = leadData.atividades?.find(atividade => atividade.tipo === 'observacao' && atividade.descricao === 'Lead visualizado' && atividade.corretor === userName && new Date(atividade.data) > fiveMinutesAgo);

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
      const {
        error
      } = await supabase.from('leads').update({
        atividades: atividadesJson
      }).eq('id', leadData.id);
      if (!error) {
        console.log('Visualização registrada com sucesso');
        // Atualizar estado local
        updateLead({
          atividades: updatedActivities
        });
      } else {
        console.error('Erro ao registrar visualização:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };
  const handleSave = async () => {
    if (!lead) return;
    try {
      const supabaseUpdates: any = {
        nome: formData.nome,
        telefone: formData.telefone,
        dados_adicionais: formData.dadosAdicionais,
        etapa: formData.etapa,
        stage_name: formData.etapa
      };
      const {
        error
      } = await supabase.from('leads').update(supabaseUpdates).eq('id', lead.id);
      if (error) {
        console.error('Erro ao atualizar lead:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar lead.",
          variant: "destructive"
        });
        return;
      }
      updateLead(formData);
      setIsEditing(false);
      toast({
        title: "Lead atualizado",
        description: "As informações do lead foram atualizadas com sucesso."
      });
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações.",
        variant: "destructive"
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
      const {
        supabase
      } = await import('@/integrations/supabase/client');
      const {
        error
      } = await supabase.from('leads').update({
        atividades: atividadesJson
      }).eq('id', lead.id);
      if (error) {
        console.error('Erro ao salvar atividade de contato:', error);
      } else {
        // Atualizar estado local
        updateLead({
          atividades: updatedActivities
        });
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
      const {
        supabase
      } = await import('@/integrations/supabase/client');
      const {
        error
      } = await supabase.from('leads').update({
        atividades: atividadesJson
      }).eq('id', lead.id);
      if (error) {
        console.error('Erro ao salvar atividade:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar atividade."
        });
        return;
      }

      // Atualizar estado local
      updateLead({
        atividades: updatedActivities
      });
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
  const handleDelete = async () => {
    if (!lead) return;
    setIsDeleting(true);
    try {
      const {
        error
      } = await supabase.functions.invoke('delete-lead', {
        body: {
          leadId: lead.id
        }
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Lead deletado",
        description: "O lead foi removido com sucesso."
      });
      navigate('/');
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar lead. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  if (!lead) {
    return <div className="min-h-screen bg-background">
        <MobileHeader title="Carregando..." showBackButton onBack={() => navigate('/')} />
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <MobileHeader title={lead.nome} showBackButton onBack={() => navigate('/')} rightElement={<div className="flex items-center gap-2">
            {/* Tags discretas no header */}
            {lead.etiquetas && lead.etiquetas.length > 0 && <div className="flex items-center gap-1 mr-2">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <div className="flex gap-1">
                  {lead.etiquetas.slice(0, 2).map((etiqueta, index) => <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] bg-primary/20 text-primary font-medium">
                      {etiqueta.length > 6 ? `${etiqueta.substring(0, 6)}...` : etiqueta}
                    </span>)}
                  {lead.etiquetas.length > 2 && <span className="text-[9px] text-muted-foreground">+{lead.etiquetas.length - 2}</span>}
                </div>
              </div>}
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(true)} className="p-2 text-destructive hover:bg-destructive/10">
              
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} className="p-2">
              <Edit className="w-5 h-5" />
            </Button>
          </div>} />

      <div className="p-4 space-y-6">
        {/* Contact Actions */}
        <div className="flex gap-3">
          <Button onClick={handleWhatsApp} className="flex-1 bg-green-500 hover:bg-green-600">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button onClick={() => setShowActivities(!showActivities)} variant="outline" className="flex-1">
            <History className="w-4 h-4 mr-2" />
            Histórico
          </Button>
        </div>

        {/* Lead Information */}
        <div className="bg-card rounded-lg p-4 space-y-4 border">
          <h2 className="text-lg font-semibold text-foreground">Informações do Lead</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={formData.nome} onChange={e => setFormData(prev => ({
              ...prev,
              nome: e.target.value
            }))} disabled={!isEditing} className={!isEditing ? "bg-muted" : ""} />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={formData.telefone} onChange={e => setFormData(prev => ({
              ...prev,
              telefone: e.target.value
            }))} disabled={!isEditing} className={!isEditing ? "bg-muted" : ""} />
            </div>

            <div>
              <Label htmlFor="etapa">Etapa</Label>
              <Select value={formData.etapa} onValueChange={value => setFormData(prev => ({
              ...prev,
              etapa: value as Lead['etapa']
            }))} disabled={!isEditing}>
                <SelectTrigger className={!isEditing ? "bg-muted" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stageLabels).map(([value, label]) => <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="dados">Dados Adicionais</Label>
                <Button variant="outline" size="sm" onClick={handleCopyDadosAdicionais} className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
              <Textarea id="dados" value={formData.dadosAdicionais} onChange={e => setFormData(prev => ({
              ...prev,
              dadosAdicionais: e.target.value
            }))} disabled={!isEditing} className={!isEditing ? "bg-muted" : ""} rows={4} placeholder="Informações extras sobre o lead..." />
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Corretor:</strong> {lead.corretor}</p>
              <p><strong className="text-foreground">Data de Criação:</strong> {lead.dataCriacao.toLocaleDateString('pt-BR')}</p>
            </div>

            {isEditing && <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => {
              setIsEditing(false);
              setFormData({
                nome: lead.nome,
                telefone: lead.telefone,
                dadosAdicionais: lead.dadosAdicionais,
                etapa: lead.etapa
              });
            }} className="flex-1">
                  Cancelar
                </Button>
              </div>}
          </div>
        </div>

        {/* Histórico de Atividades */}
        {showActivities && <div className="bg-card rounded-lg p-4 space-y-4 border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Atividades
            </h2>
            
            {/* Nova Atividade */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea placeholder="Adicionar nova atividade..." value={newActivity} onChange={e => setNewActivity(e.target.value)} className="flex-1" rows={2} />
                <Button onClick={handleAddActivity} disabled={!newActivity.trim()} className="h-fit">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Lista de Atividades */}
            <div className="space-y-3">
              {lead.atividades && lead.atividades.length > 0 ? [...lead.atividades].reverse().map((atividade, index) => <div key={index} className="border-l-2 border-primary/30 pl-4 py-2">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{atividade.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(atividade.data).toLocaleString('pt-BR')} • {atividade.corretor}
                        </p>
                      </div>
                    </div>
                  </div>) : <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">Nenhuma atividade registrada ainda</p>
                </div>}
            </div>
          </div>}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o lead <strong>{lead.nome}</strong>?
              <br /><br />
              Esta ação é irreversível e irá remover:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todas as atividades registradas</li>
                <li>Todos os relacionamentos com tags</li>
                <li>Todos os logs associados</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deletando...' : 'Deletar Lead'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}