import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadRecuperarData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
  company_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const leadData: LeadRecuperarData = await req.json();
    console.log('Dados recebidos para recuperar:', leadData);

    // Validate required fields
    if (!leadData.nome || !leadData.telefone) {
      return new Response(
        JSON.stringify({ 
          error: 'Campos obrigatórios não fornecidos',
          details: 'Nome e telefone são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // IMPORTANTE: Esta função é exclusiva para a empresa específica
    const EMPRESA_RECUPERAR_ID = 'c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6';
    const companyId = EMPRESA_RECUPERAR_ID;

    // Validar se a empresa existe
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (!company) {
      return new Response(
        JSON.stringify({ 
          error: 'Empresa não encontrada ou não autorizada para esta função' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get next user for round-robin assignment
    const { data: nextUser } = await supabase.rpc('get_next_user_round_robin', {
      _company_id: companyId
    });

    if (!nextUser) {
      return new Response(
        JSON.stringify({ 
          error: 'Nenhum usuário disponível para atribuição' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // First, check if there's a custom "Recuperar" stage for this company
    const { data: recuperarStage } = await supabase
      .from('lead_stages')
      .select('nome')
      .eq('company_id', companyId)
      .eq('nome', 'Recuperar')
      .eq('ativo', true)
      .single();

    // Create lead using safe function with "Recuperar" identifier
    const { data: leadResult } = await supabase.rpc('create_lead_safe', {
      _nome: leadData.nome,
      _telefone: leadData.telefone,
      _dados_adicionais: `RECUPERAR: ${leadData.dados_adicionais || ''}`.trim(),
      _company_id: companyId,
      _user_id: nextUser
    });

    if (!leadResult || leadResult.length === 0) {
      throw new Error('Erro ao criar lead para recuperar');
    }

    const leadId = leadResult[0].lead_id;
    const isDuplicate = leadResult[0].is_duplicate;

    console.log('Lead para recuperar criado/encontrado:', { leadId, isDuplicate });

    // Update lead to "Recuperar" stage
    let updateData: any = {};
    
    if (recuperarStage) {
      // Use custom stage if exists
      updateData.etapa = 'aguardando-atendimento'; // Keep default etapa
      updateData.stage_name = 'Recuperar'; // Set custom stage name
    } else {
      // Use stage_name for "Recuperar"  
      updateData.stage_name = 'Recuperar';
    }

    // Update the lead with the correct stage
    await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId);

    console.log('Lead atualizado para etapa Recuperar:', leadId);

    // Add the specific tag for "Recuperar" leads
    const tagId = 'e169ffc5-5574-4a7c-8c06-15bec4b59b63';
    
    // Check if tag relation already exists
    const { data: existingTag } = await supabase
      .from('lead_tag_relations')
      .select('id')
      .eq('lead_id', leadId)
      .eq('tag_id', tagId)
      .single();

    if (!existingTag) {
      const { error: tagError } = await supabase
        .from('lead_tag_relations')
        .insert({
          lead_id: leadId,
          tag_id: tagId
        });

      if (tagError) {
        console.error('Erro ao adicionar tag de recuperar:', tagError);
      } else {
        console.log('Tag "Recuperar" adicionada ao lead:', leadId);
      }
    }

    // Timestamp já foi atualizado atomicamente pela função get_next_user_round_robin
    // Não precisamos atualizar novamente aqui

    // Enviar notificação push para o usuário (apenas se não for duplicata)
    if (!isDuplicate) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: nextUser,
            title: '🔔 Opa! Novo Lead!',
            body: `Corre lá, que o lead ${leadData.nome} está esperando seu atendimento!`,
            data: { leadId, url: '/' }
          }
        });
        console.log('Notificação push enviada para usuário:', nextUser);
      } catch (notificationError) {
        console.error('Erro ao enviar notificação push:', notificationError);
      }
    }

    // Get complete lead data to return
    const { data: completeLeadData } = await supabase
      .from('leads')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        ),
        lead_tag_relations (
          lead_tags (
            id,
            nome,
            cor
          )
        )
      `)
      .eq('id', leadId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        lead: completeLeadData,
        message: isDuplicate ? 'Lead recuperar já existia' : 'Lead recuperar criado com sucesso',
        isDuplicate
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook recuperar:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});