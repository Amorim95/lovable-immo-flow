import { supabase } from "@/integrations/supabase/client";

interface SaveExportHistoryParams {
  exportType: 'excel' | 'pdf';
  totalLeads: number;
  filtersApplied: {
    dateFilter?: string;
    customDateRange?: { from: Date; to: Date };
    selectedEquipeId?: string | null;
    selectedUserId?: string | null;
    selectedStageNames?: string[];
    selectedTagIds?: string[];
  };
  filename: string;
}

export async function saveExportHistory(params: SaveExportHistoryParams): Promise<void> {
  try {
    // Obter user_id e company_id do usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return;
    }

    // Buscar company_id do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      console.error('Company ID não encontrado');
      return;
    }

    // Inserir histórico de exportação
    const { error } = await supabase
      .from('export_history')
      .insert([{
        user_id: user.id,
        company_id: userData.company_id,
        export_type: params.exportType,
        total_leads: params.totalLeads,
        filters_applied: params.filtersApplied as any,
        filename: params.filename
      }]);

    if (error) {
      console.error('Erro ao salvar histórico de exportação:', error);
    }
  } catch (error) {
    // Falha silenciosa - não impede a exportação
    console.error('Erro ao salvar histórico:', error);
  }
}
