import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COMPANY_ID = 'fcccf617-0fb0-4745-8048-a4632d80de6d';
const TAG_NAO_QUALIFICADO_ID = 'e169ffc5-5574-4a7c-8c06-15bec4b59b63';

interface LeadData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Suporte a JSON e Form Data
    let leadData: LeadData;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      leadData = {
        nome: formData.get('nome')?.toString() || '',
        telefone: formData.get('telefone')?.toString() || '',
        dados_adicionais: formData.get('dados_adicionais')?.toString() || '',
      };
    } else {
      const rawBody = await req.text();
      console.log('[webhook-lead-invest-imoveis-nao-qualificado] Payload bruto:', rawBody);
      try {
        leadData = JSON.parse(rawBody);
      } catch {
        return new Response(
          JSON.stringify({ error: 'JSON inválido', rawBody }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[webhook-lead-invest-imoveis-nao-qualificado] Dados recebidos:', JSON.stringify(leadData));

    if (!leadData.nome || !leadData.telefone) {
      return new Response(
        JSON.stringify({ error: 'Nome e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Round-robin
    const { data: nextUserId, error: userError } = await supabase
      .rpc('get_next_user_round_robin', { _company_id: COMPANY_ID });

    if (userError || !nextUserId) {
      console.error('[webhook-lead-invest-imoveis-nao-qualificado] Erro ao buscar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário ativo disponível para atribuição' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[webhook-lead-invest-imoveis-nao-qualificado] Usuário selecionado:', nextUserId);

    // Criar lead
    const { data: leadResult, error: leadError } = await supabase
      .rpc('create_lead_safe', {
        _nome: leadData.nome.trim(),
        _telefone: leadData.telefone.trim(),
        _dados_adicionais: leadData.dados_adicionais || null,
        _company_id: COMPANY_ID,
        _user_id: nextUserId
      });

    if (leadError) {
      console.error('[webhook-lead-invest-imoveis-nao-qualificado] Erro ao criar lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = leadResult[0];
    const leadId = result.lead_id;
    console.log('[webhook-lead-invest-imoveis-nao-qualificado] Resultado:', result);

    // Mover para etapa "Recuperar" e adicionar tag
    await supabase
      .from('leads')
      .update({
        etapa: 'aguardando-atendimento',
        stage_name: 'Recuperar',
        assigned_at: new Date().toISOString()
      })
      .eq('id', leadId);

    // Adicionar tag "Não Qualificado"
    const { data: existingTag } = await supabase
      .from('lead_tag_relations')
      .select('id')
      .eq('lead_id', leadId)
      .eq('tag_id', TAG_NAO_QUALIFICADO_ID)
      .single();

    if (!existingTag) {
      const { error: tagError } = await supabase
        .from('lead_tag_relations')
        .insert({ lead_id: leadId, tag_id: TAG_NAO_QUALIFICADO_ID });

      if (tagError) {
        console.error('[webhook-lead-invest-imoveis-nao-qualificado] Erro ao adicionar tag:', tagError);
      } else {
        console.log('[webhook-lead-invest-imoveis-nao-qualificado] Tag "Não Qualificado" adicionada');
      }
    }

    // Notificação push (apenas leads novos)
    if (!result.is_duplicate) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: nextUserId,
            title: '🔔 Opa! Novo Lead!',
            body: `Corre lá, que o lead ${leadData.nome} está esperando seu atendimento!`,
            data: { leadId, url: '/' }
          }
        });
        console.log('[webhook-lead-invest-imoveis-nao-qualificado] Notificação enviada');
      } catch (notifError) {
        console.error('[webhook-lead-invest-imoveis-nao-qualificado] Erro notificação:', notifError);
      }
    }

    // Buscar lead completo
    const { data: completeLead } = await supabase
      .from('leads')
      .select('*, users:user_id (id, name, email), lead_tag_relations (lead_tags (id, nome, cor))')
      .eq('id', leadId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: result.is_duplicate ? 'Lead já existe (duplicata)' : 'Lead criado na etapa Recuperar com tag Não Qualificado',
        is_duplicate: result.is_duplicate,
        lead: completeLead || { id: leadId }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[webhook-lead-invest-imoveis-nao-qualificado] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
