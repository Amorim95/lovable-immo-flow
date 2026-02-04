import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// IDs fixos para Click Imóveis
const CLICK_IMOVEIS_COMPANY_ID = 'c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6';
const TAG_LEAD_QUALIFICADO_IA_ID = '89b0d175-7ac8-44b3-9f47-dec34353ccac';

interface LeadClickImoveisData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate request method
    if (req.method !== 'POST') {
      console.log('[webhook-lead-click-imoveis] Método não permitido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const leadData: LeadClickImoveisData = await req.json();
    console.log('[webhook-lead-click-imoveis] Dados recebidos:', JSON.stringify(leadData));

    // Validate required fields
    if (!leadData.nome || !leadData.telefone) {
      console.log('[webhook-lead-click-imoveis] Campos obrigatórios faltando');
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: nome e telefone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar telefone (remover caracteres não numéricos)
    const telefoneLimpo = leadData.telefone.replace(/\D/g, '');

    // Get next active user from Click Imóveis using round-robin
    const { data: nextUser, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('company_id', CLICK_IMOVEIS_COMPANY_ID)
      .eq('status', 'ativo')
      .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })
      .limit(1)
      .single();

    if (userError || !nextUser) {
      console.error('[webhook-lead-click-imoveis] Nenhum usuário ativo disponível:', userError);
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário ativo disponível na Click Imóveis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[webhook-lead-click-imoveis] Usuário selecionado:', nextUser.name, nextUser.id);

    // Create lead using create_lead_safe function
    const { data: leadResult, error: leadError } = await supabase.rpc('create_lead_safe', {
      _nome: leadData.nome,
      _telefone: telefoneLimpo,
      _dados_adicionais: leadData.dados_adicionais || null,
      _company_id: CLICK_IMOVEIS_COMPANY_ID,
      _user_id: nextUser.id
    });

    if (leadError) {
      console.error('[webhook-lead-click-imoveis] Erro ao criar lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = leadResult[0];
    console.log('[webhook-lead-click-imoveis] Resultado da criação:', result);

    // Se não for duplicata, adicionar etiqueta e atualizar usuário
    if (!result.is_duplicate) {
      // Adicionar etiqueta "Lead Qualificado Pela IA"
      const { error: tagError } = await supabase
        .from('lead_tag_relations')
        .insert({
          lead_id: result.lead_id,
          tag_id: TAG_LEAD_QUALIFICADO_IA_ID
        });

      if (tagError) {
        console.error('[webhook-lead-click-imoveis] Erro ao adicionar etiqueta:', tagError);
      } else {
        console.log('[webhook-lead-click-imoveis] Etiqueta "Lead Qualificado Pela IA" adicionada');
      }

      // Update ultimo_lead_recebido for the selected user
      const { error: updateError } = await supabase
        .from('users')
        .update({ ultimo_lead_recebido: new Date().toISOString() })
        .eq('id', nextUser.id);

      if (updateError) {
        console.error('[webhook-lead-click-imoveis] Erro ao atualizar ultimo_lead_recebido:', updateError);
      }

      // Enviar notificação push para o usuário
      console.log('[webhook-lead-click-imoveis] Enviando notificação push para:', nextUser.id);
      try {
        const notificationResponse = await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: nextUser.id,
            title: '🔔 Novo Lead!',
            body: `Chegou um novo lead para você!`,
            data: {
              leadId: result.lead_id,
              url: '/'
            }
          }
        });

        if (notificationResponse.error) {
          console.error('[webhook-lead-click-imoveis] Erro ao enviar notificação:', notificationResponse.error);
        } else {
          console.log('[webhook-lead-click-imoveis] Notificação enviada com sucesso');
        }
      } catch (notificationError) {
        console.error('[webhook-lead-click-imoveis] Erro ao invocar função de notificação:', notificationError);
      }
    }

    // Fetch complete lead data
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select(`
        *,
        user:users(id, name, email),
        lead_tag_relations(
          tag:lead_tags(id, nome, cor)
        )
      `)
      .eq('id', result.lead_id)
      .single();

    if (fetchError) {
      console.error('[webhook-lead-click-imoveis] Erro ao buscar lead completo:', fetchError);
    }

    console.log('[webhook-lead-click-imoveis] Lead processado com sucesso:', {
      lead_id: result.lead_id,
      is_duplicate: result.is_duplicate,
      assigned_to: nextUser.name
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: result.is_duplicate ? 'Lead já existe (duplicata)' : 'Lead criado com sucesso',
        is_duplicate: result.is_duplicate,
        lead: lead || { id: result.lead_id },
        assigned_to: {
          user_id: nextUser.id,
          user_name: nextUser.name
        }
      }),
      { status: result.is_duplicate ? 200 : 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[webhook-lead-click-imoveis] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
