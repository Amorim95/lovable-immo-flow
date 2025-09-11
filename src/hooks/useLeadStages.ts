import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyFilter } from './useCompanyFilter';
import { toast } from 'sonner';

export interface LeadStage {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  company_id: string;
}

export function useLeadStages() {
  const [stages, setStages] = useState<LeadStage[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCompanyId } = useCompanyFilter();

  const loadStages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_stages')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error('Erro ao carregar etapas dos leads');
    } finally {
      setLoading(false);
    }
  };

  const createStage = async (nome: string, cor: string) => {
    try {
      const companyId = getCompanyId();
      if (!companyId) throw new Error('ID da empresa não encontrado');

      const maxOrdem = Math.max(...stages.map(s => s.ordem), 0);
      
      const { data, error } = await supabase
        .from('lead_stages')
        .insert({
          nome,
          cor,
          ordem: maxOrdem + 1,
          company_id: companyId
        })
        .select()
        .single();

      if (error) throw error;
      
      setStages(prev => [...prev, data]);
      toast.success('Etapa criada com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
      toast.error('Erro ao criar etapa');
      throw error;
    }
  };

  const updateStage = async (id: string, updates: Partial<Pick<LeadStage, 'nome' | 'cor' | 'ordem'>>) => {
    try {
      const current = stages.find(s => s.id === id);
      const { data, error } = await supabase
        .from('lead_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Se o nome mudou, atualizar todos os leads da empresa com o stage_name antigo
      if (updates.nome && current && updates.nome !== current.nome) {
        const companyId = getCompanyId();
        await supabase
          .from('leads')
          .update({ stage_name: updates.nome })
          .eq('stage_name', current.nome)
          .eq('company_id', companyId);
      }
      
      setStages(prev => prev.map(stage => 
        stage.id === id ? { ...stage, ...data } : stage
      ));
      toast.success('Etapa atualizada com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      toast.error('Erro ao atualizar etapa');
      throw error;
    }
  };

  const deleteStage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lead_stages')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      
      setStages(prev => prev.filter(stage => stage.id !== id));
      toast.success('Etapa removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover etapa:', error);
      toast.error('Erro ao remover etapa');
      throw error;
    }
  };

  const reorderStages = async (stageIds: string[]) => {
    try {
      const updates = stageIds.map((id, index) => ({
        id,
        ordem: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('lead_stages')
          .update({ ordem: update.ordem })
          .eq('id', update.id);
      }

      setStages(prev => 
        prev.map(stage => {
          const newOrder = stageIds.findIndex(id => id === stage.id) + 1;
          return { ...stage, ordem: newOrder };
        }).sort((a, b) => a.ordem - b.ordem)
      );

      toast.success('Ordem das etapas atualizada');
    } catch (error) {
      console.error('Erro ao reordenar etapas:', error);
      toast.error('Erro ao reordenar etapas');
      throw error;
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  return {
    stages,
    loading,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    refreshStages: loadStages
  };
}