import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
}

const COMPANY_ID = 'fcccf617-0fb0-4745-8048-a4632d80de6d';
const TAG_QUALIFICADO_IA = '89b0d175-7ac8-44b3-9f47-dec34353ccac';

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

    const leadData: LeadData = await req.json();
    console.log('Lead Invest + Imóveis recebido:', leadData);

    if (!leadData.nome || !leadData.telefone) {
      return new Response(
        JSON.stringify({ error: 'Nome e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', COMPANY_ID)
      .single();

    if (companyError || !company) {
      console.error('Erro ao buscar empresa:', companyError);
      return new Response(
        JSON.stringify({ error: 'Empresa Invest + Imóveis não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Empresa encontrada:', company.name);

    // Round-robin
    const { data: nextUserId, error: userError } = await supabase
      .rpc('get_next_user_round_robin', { _company_id: COMPANY_ID });

    if (userError || !nextUserId) {
      console.error('Erro ao buscar próximo usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário ativo disponível para atribuição' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Usuário selecionado:', nextUserId);

    // Criar lead
    const { data: leadResult, error: leadError } = await supabase
      .rpc('create_lead_safe', {
        _nome: leadData.nome,
        _telefone: leadData.telefone,
        _dados_adicionais: leadData.dados_adicionais || null,
        _company_id: COMPANY_ID,
        _user_id: nextUserId
      });

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = leadResult[0];
    console.log('Resultado da criação do lead:', result);

    // Adicionar etiqueta e notificação apenas se não for duplicata
    if (!result.is_duplicate) {
      // Adicionar etiqueta "Lead Qualificado pela IA"
      const { error: tagError } = await supabase
        .from('lead_tag_relations')
        .insert({ lead_id: result.lead_id, tag_id: TAG_QUALIFICADO_IA });

      if (tagError) {
        console.error('Erro ao adicionar etiqueta:', tagError);
      } else {
        console.log('Etiqueta adicionada com sucesso');
      }

      // Atualizar assigned_at
      await supabase
        .from('leads')
        .update({ assigned_at: new Date().toISOString() })
        .eq('id', result.lead_id);

      // Salvar notificação no histórico
      try {
        await supabase.from('notifications').insert({
          user_id: nextUserId, company_id: COMPANY_ID,
          title: '🔔 Opa! Novo Lead!', body: `Corre lá, que o lead ${leadData.nome} está esperando seu atendimento!`,
          type: 'lead', lead_id: result.lead_id,
        });
      } catch (e) { console.error('Erro ao salvar notificação:', e); }

      // Notificação push
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: { userId: nextUserId, title: '🔔 Opa! Novo Lead!', body: `Corre lá, que o lead ${leadData.nome} está esperando seu atendimento!`, data: { leadId: result.lead_id, url: '/' } }
        });
        console.log('Notificação push enviada para:', nextUserId);
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
      }
    }

    // Buscar lead completo
    const { data: completeLead, error: fetchError } = await supabase
      .from('leads')
      .select('*, users:user_id (id, name, email)')
      .eq('id', result.lead_id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar lead completo:', fetchError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        is_duplicate: result.is_duplicate,
        lead: completeLead || { id: result.lead_id }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
