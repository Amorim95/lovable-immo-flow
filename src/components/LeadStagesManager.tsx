import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { useLeadStages } from '@/hooks/useLeadStages';
import { usePermissions } from '@/hooks/usePermissions';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const stageFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cor: z.string().min(1, 'Cor é obrigatória'),
});

type StageFormData = z.infer<typeof stageFormSchema>;

export function LeadStagesManager() {
  const { stages, loading, createStage, updateStage, deleteStage, reorderStages } = useLeadStages();
  const { isAdmin } = usePermissions();
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<StageFormData>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: {
      nome: '',
      cor: '#3B82F6',
    },
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Apenas administradores podem gerenciar as etapas dos leads.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (data: StageFormData) => {
    try {
      if (editingStage) {
        await updateStage(editingStage, data);
        setEditingStage(null);
      } else {
        await createStage(data.nome, data.cor);
        setIsCreating(false);
      }
      form.reset();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleEdit = (stage: any) => {
    setEditingStage(stage.id);
    form.setValue('nome', stage.nome);
    form.setValue('cor', stage.cor);
  };

  const handleDelete = async (stageId: string) => {
    if (confirm('Tem certeza que deseja remover esta etapa? Esta ação não pode ser desfeita.')) {
      await deleteStage(stageId);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const stageIds = items.map(item => item.id);
    reorderStages(stageIds);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Etapas dos Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Etapas dos Leads</CardTitle>
        <CardDescription>
          Configure as etapas personalizadas para sua empresa. Você pode criar, editar, excluir e reordenar as etapas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Etapas Atuais</h3>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Etapa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Etapa</DialogTitle>
                <DialogDescription>
                  Defina um nome e cor para a nova etapa do lead.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Etapa</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Primeiro Contato" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Criar Etapa</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="stages">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {stages.map((stage, index) => (
                  <Draggable key={stage.id} draggableId={stage.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: stage.cor }}
                          />
                          <span className="font-medium">{stage.nome}</span>
                          <Badge variant="secondary">Ordem {stage.ordem}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog 
                            open={editingStage === stage.id} 
                            onOpenChange={(open) => !open && setEditingStage(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(stage)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Etapa</DialogTitle>
                                <DialogDescription>
                                  Modifique o nome e cor da etapa.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name="nome"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nome da Etapa</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="cor"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Cor</FormLabel>
                                        <FormControl>
                                          <Input type="color" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setEditingStage(null)}>
                                      Cancelar
                                    </Button>
                                    <Button type="submit">Salvar Alterações</Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stage.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {stages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma etapa configurada. Clique em "Nova Etapa" para começar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}