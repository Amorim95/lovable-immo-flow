
import { useState } from "react";
import { Lead, LeadTag, Atividade } from "@/types/crm";
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
import { TagSelector } from "@/components/TagSelector";
import { 
  Phone, 
  User, 
  Edit,
  Calendar 
} from "lucide-react";

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (leadId: string, updates: Partial<Lead>) => void;
}

export function LeadModal({ lead, isOpen, onClose, onUpdate }: LeadModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [newActivity, setNewActivity] = useState("");

  if (!lead) return null;

  const handleSave = () => {
    onUpdate(lead.id, formData);
    setEditMode(false);
    setFormData({});
  };

  const handleAddActivity = () => {
    if (!newActivity.trim()) return;
    
    const activity: Atividade = {
      id: Date.now().toString(),
      tipo: 'observacao',
      descricao: newActivity,
      data: new Date(),
      corretor: lead.corretor
    };

    onUpdate(lead.id, {
      atividades: [...lead.atividades, activity]
    });
    
    setNewActivity("");
  };

  const handleWhatsAppClick = (telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const handleTagsChange = (newTags: LeadTag[]) => {
    onUpdate(lead.id, { etiquetas: newTags });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {lead.nome} - {lead.imovel}
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

                {/* Etiquetas */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Etiquetas</h4>
                  <TagSelector
                    selectedTags={lead.etiquetas}
                    onTagsChange={handleTagsChange}
                  />
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
                      <Label>Imóvel</Label>
                      <Input
                        value={editMode ? (formData.imovel ?? lead.imovel) : lead.imovel}
                        onChange={(e) => setFormData({ ...formData, imovel: e.target.value })}
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
                      <Label>Telefone Extra</Label>
                      <div className="flex gap-2">
                        <Input
                          value={editMode ? (formData.telefoneExtra ?? lead.telefoneExtra ?? '') : lead.telefoneExtra ?? ''}
                          onChange={(e) => setFormData({ ...formData, telefoneExtra: e.target.value })}
                          disabled={!editMode}
                        />
                        {lead.telefoneExtra && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWhatsAppClick(lead.telefoneExtra!)}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Renda Familiar</Label>
                      <Input
                        type="number"
                        value={editMode ? (formData.rendaFamiliar ?? lead.rendaFamiliar) : lead.rendaFamiliar}
                        onChange={(e) => setFormData({ ...formData, rendaFamiliar: Number(e.target.value) })}
                        disabled={!editMode}
                      />
                    </div>
                    <div>
                      <Label>Corretor</Label>
                      <Input
                        value={lead.corretor}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Tem FGTS?</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={editMode ? String(formData.temFGTS ?? lead.temFGTS) : String(lead.temFGTS)}
                        onChange={(e) => setFormData({ ...formData, temFGTS: e.target.value === 'true' })}
                        disabled={!editMode}
                      >
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    </div>
                    <div>
                      <Label>Possui Entrada?</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={editMode ? String(formData.possuiEntrada ?? lead.possuiEntrada) : String(lead.possuiEntrada)}
                        onChange={(e) => setFormData({ ...formData, possuiEntrada: e.target.value === 'true' })}
                        disabled={!editMode}
                      >
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    </div>
                    <div>
                      <Label>Data de Criação</Label>
                      <Input
                        value={formatDate(lead.dataCriacao)}
                        disabled
                      />
                    </div>
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
