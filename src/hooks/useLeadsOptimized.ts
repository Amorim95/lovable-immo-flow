import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Lead } from '@/types/crm';

interface LeadsData {
  id: string;
  nome: string;
  telefone: string;
  dados_adicionais?: string;
  etapa: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  user?: {
    name: string;
    equipe_id?: string;
  };
  lead_tag_relations?: {
    lead_tags: {
      id: string;
      nome: string;
      cor: string;
    };
  }[];
}

export function useLeadsOptimized() {
  const { user } = useAuth();
  const { isAdmin, isGestor, isCorretor, loading: roleLoading } = useUserRole();
  const [leads, setLeads] = useState<LeadsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || roleLoading) return;
    loadLeads();
  }, [user, isAdmin, isGestor, isCorretor, roleLoading]);

  const loadLeads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leads')
        .select(`
          id,
          nome,
          telefone,
          dados_adicionais,
          etapa,
          created_at,
          updated_at,
          user_id,
          user:users(name, equipe_id),
          lead_tag_relations(
            lead_tags(
              id,
              nome,
              cor
            )
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error loading leads:', error);
        setError('Erro ao carregar leads');
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      setError('Erro interno ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  // Atualização otimística de um lead específico
  const updateLeadOptimistic = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // 1. Atualizar otimisticamente o estado local primeiro (sem piscada)
      setLeads(currentLeads => 
        currentLeads.map(lead => {
          if (lead.id === leadId) {
            const updatedLead = { ...lead };
            
            if (updates.nome !== undefined) updatedLead.nome = updates.nome;
            if (updates.telefone !== undefined) updatedLead.telefone = updates.telefone;
            if (updates.dadosAdicionais !== undefined) updatedLead.dados_adicionais = updates.dadosAdicionais;
            if (updates.etapa !== undefined) updatedLead.etapa = updates.etapa;
            
            // Para tags, vamos simular a estrutura
            if (updates.etiquetas !== undefined) {
              updatedLead.lead_tag_relations = updates.etiquetas.map(tagName => ({
                lead_tags: {
                  id: `temp-${tagName}`,
                  nome: tagName,
                  cor: '#3B82F6'
                }
              }));
            }
            
            return updatedLead;
          }
          return lead;
        })
      );

      // 2. Depois fazer a atualização no banco de dados
      const supabaseUpdates: any = {};
      
      if (updates.nome !== undefined) supabaseUpdates.nome = updates.nome;
      if (updates.telefone !== undefined) supabaseUpdates.telefone = updates.telefone;
      if (updates.dadosAdicionais !== undefined) supabaseUpdates.dados_adicionais = updates.dadosAdicionais;
      if (updates.etapa !== undefined) supabaseUpdates.etapa = updates.etapa;
      
      // Atualizar campos básicos no banco se necessário
      if (Object.keys(supabaseUpdates).length > 0) {
        const { error } = await supabase
          .from('leads')
          .update(supabaseUpdates)
          .eq('id', leadId);
          
        if (error) {
          console.error('Erro ao atualizar lead:', error);
          // Reverter a atualização otimística em caso de erro
          await loadLeads();
          return false;
        }
      }
      
      // Gerenciar tags se foram atualizadas
      if (updates.etiquetas !== undefined) {
        // Deletar tags existentes
        await supabase
          .from('lead_tag_relations')
          .delete()
          .eq('lead_id', leadId);
          
        // Inserir novas tags se existirem
        if (updates.etiquetas.length > 0) {
          const { data: tagIds, error: tagError } = await supabase
            .from('lead_tags')
            .select('id, nome')
            .in('nome', updates.etiquetas);
            
          if (tagError) {
            console.error('Erro ao buscar tags:', tagError);
            await loadLeads(); // Recarregar em caso de erro
            return false;
          }
          
          const relations = tagIds?.map(tag => ({
            lead_id: leadId,
            tag_id: tag.id
          })) || [];
          
          if (relations.length > 0) {
            const { error: relationError } = await supabase
              .from('lead_tag_relations')
              .insert(relations);
              
            if (relationError) {
              console.error('Erro ao inserir relações de tags:', relationError);
              await loadLeads(); // Recarregar em caso de erro
              return false;
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao processar atualização:', error);
      // Recarregar dados em caso de erro
      await loadLeads();
      return false;
    }
  };

  const refreshLeads = () => {
    loadLeads();
  };

  return {
    leads,
    loading,
    error,
    refreshLeads,
    updateLeadOptimistic,
    canCreateLeads: isAdmin || isGestor || isCorretor,
    canAssignLeads: isAdmin || isGestor,
    canViewAllLeads: isAdmin,
    canViewTeamLeads: isAdmin || isGestor
  };
}