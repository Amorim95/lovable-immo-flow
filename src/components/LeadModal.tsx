
import { useState, useEffect } from "react";
import { Lead, Atividade } from "@/types/crm";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  User, 
  Edit,
  Calendar 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (leadId: string, updates: Partial<Lead>) => void;
}

export function LeadModal({ lead, isOpen, onClose, onUpdate }: LeadModalProps) {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [newActivity, setNewActivity] = useState("");
  // Reset estados quando modal abre/fecha
  useEffect(() => {
    if (isOpen && lead) {
      setEditMode(false);
      setFormData({});
      setNewActivity("");
    }
  }, [isOpen, lead?.id]);

  if (!lead) return null;

  const handleSave = async () => {
    try {
      const updateData: any = {};
      
      // Apenas incluir campos que mudaram
      if (formData.nome !== undefined) updateData.nome = formData.nome;
      if (formData.telefone !== undefined) updateData.telefone = formData.telefone;
      if (formData.dadosAdicionais !== undefined) updateData.dados_adicionais = formData.dadosAdicionais;
      if (formData.etapa !== undefined) updateData.etapa = formData.etapa;

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id);

      if (error) {
        console.error('Erro ao salvar lead:', error);
        toast.error('Erro ao salvar alterações');
        return;
      }

      onUpdate(lead.id, formData);
      setEditMode(false);
      setFormData({});
      toast.success('Lead atualizado com sucesso!');
    } catch (error) {
      console.error('Erro geral:', error);
      toast.error('Erro ao salvar alterações');
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    
    const activity: Atividade = {
      id: Date.now().toString(),
      tipo: 'observacao',
      descricao: newActivity,
      data: new Date(),
      corretor: user?.name || 'Usuário não identificado'
    };

    const updatedActivities = [...lead.atividades, activity];

    try {
      // Converter atividades para o formato JSON correto
      const atividadesJson = updatedActivities.map(atividade => ({
        id: atividade.id,
        tipo: atividade.tipo,
        descricao: atividade.descricao,
        data: atividade.data.toISOString(),
        corretor: atividade.corretor
      }));

      const { error } = await supabase
        .from('leads')
        .update({ atividades: atividadesJson as any })
        .eq('id', lead.id);

      if (error) {
        console.error('Erro ao salvar atividade:', error);
        toast.error('Erro ao salvar atividade');
        return;
      }

      onUpdate(lead.id, {
        atividades: updatedActivities
      });
      
      setNewActivity("");
      toast.success('Atividade adicionada com sucesso!');
    } catch (error) {
      console.error('Erro geral:', error);
      toast.error('Erro ao salvar atividade');
    }
  };

  const handleWhatsAppClick = async (telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    
    // Log primeira tentativa de contato
    const activity: Atividade = {
      id: Date.now().toString(),
      tipo: 'observacao',
      descricao: `Primeira tentativa de contato`,
      data: new Date(),
      corretor: user?.name || 'Usuário não identificado'
    };

    const updatedActivities = [...lead.atividades, activity];

    try {
      // Converter atividades para o formato JSON correto
      const atividadesJson = updatedActivities.map(atividade => ({
        id: atividade.id,
        tipo: atividade.tipo,
        descricao: atividade.descricao,
        data: atividade.data.toISOString(),
        corretor: atividade.corretor
      }));

      const { error } = await supabase
        .from('leads')
        .update({ atividades: atividadesJson as any })
        .eq('id', lead.id);

      if (error) {
        console.error('Erro ao salvar atividade de contato:', error);
        toast.error('Erro ao registrar tentativa de contato');
        return;
      }

      onUpdate(lead.id, {
        atividades: updatedActivities
      });
    } catch (error) {
      console.error('Erro geral:', error);
      toast.error('Erro ao registrar tentativa de contato');
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {editMode ? (
              <div className="flex gap-2 flex-1">
                <Input
                  value={formData.nome ?? lead.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do lead"
                  className="flex-1"
                />
              </div>
            ) : (
              lead.nome
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(95vh-120px)]">
          {/* Coluna Principal - Dados do Lead */}
          <div className="lg:col-span-2">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Dados do Lead</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {editMode ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>

                {/* Etapa do Lead */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Etapa do Lead</h4>
                  <Select
                    value={lead.etapa}
                    onValueChange={(value) => onUpdate(lead.id, { etapa: value as Lead['etapa'] })}
                  >
                    <SelectTrigger className="w-full">
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
                </div>

                <Separator />

                {/* Dados Primários */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Dados Primários</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={editMode ? (formData.nome ?? lead.nome) : lead.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        disabled={!editMode}
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <div className="flex gap-2">
                        <Input
                          value={editMode ? (formData.telefone ?? lead.telefone) : lead.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          disabled={!editMode}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWhatsAppClick(lead.telefone)}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Corretor</Label>
                      <Input
                        value={lead.corretor}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Data de Criação</Label>
                      <Input
                        value={formatDate(lead.dataCriacao)}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Dados Adicionais do Lead</Label>
                    <Textarea
                      value={editMode ? (formData.dadosAdicionais ?? lead.dadosAdicionais ?? '') : lead.dadosAdicionais ?? ''}
                      onChange={(e) => setFormData({ ...formData, dadosAdicionais: e.target.value })}
                      disabled={!editMode}
                      placeholder="Digite informações adicionais sobre o lead..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                </div>

                {editMode && (
                  <div className="flex gap-2 pb-4">
                    <Button onClick={handleSave}>Salvar</Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Coluna Lateral - Atividades */}
          <div className="space-y-4 flex flex-col h-full">
            <h3 className="text-lg font-semibold">Histórico de Atividades</h3>
            
            {/* Adicionar Nova Atividade */}
            <div className="space-y-2">
              <Textarea
                placeholder="Adicionar nova atividade..."
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddActivity} size="sm" className="w-full">
                Adicionar Atividade
              </Button>
            </div>

            <Separator />

            {/* Lista de Atividades */}
            <div className="flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-4">
                  {lead.atividades.map((atividade) => (
                    <div key={atividade.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {formatDate(atividade.data)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {atividade.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-800">{atividade.descricao}</p>
                      <p className="text-xs text-gray-500 mt-1">Por: {atividade.corretor}</p>
                    </div>
                  ))}
                  
                  {lead.atividades.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Nenhuma atividade registrada</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
