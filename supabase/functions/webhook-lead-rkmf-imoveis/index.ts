import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
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
      console.log('Payload bruto recebido:', rawBody);
      try {
        leadData = JSON.parse(rawBody);
      } catch {
        return new Response(
          JSON.stringify({ error: 'JSON inválido', rawBody }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Lead RKMF Imóveis recebido:', leadData);

    if (!leadData.nome || !leadData.telefone) {
      return new Response(
        JSON.stringify({ error: 'Nome e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const EMPRESA_RKMF_ID = '1f12e1c1-a516-407f-aedd-865ef57b5ea3';
    const TAG_QUALIFICADO_IA_ID = '89b0d175-7ac8-44b3-9f47-dec34353ccac';

    // Round-robin entre todos os usuários ativos da empresa
    const { data: nextUserId, error: userError } = await supabaseClient
      .rpc('get_next_user_round_robin', { _company_id: EMPRESA_RKMF_ID });

    if (userError || !nextUserId) {
      console.error('Erro ao buscar próximo usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário ativo disponível para atribuição' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Usuário selecionado:', nextUserId);

    // Criar lead com proteção contra duplicatas
    const { data: leadResult, error: leadError } = await supabaseClient
      .rpc('create_lead_safe', {
        _nome: leadData.nome.trim(),
        _telefone: leadData.telefone.trim(),
        _dados_adicionais: leadData.dados_adicionais || null,
        _company_id: EMPRESA_RKMF_ID,
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
    console.log('Resultado:', result);

    // Notificação push e tag (apenas para leads novos)
    if (!result.is_duplicate) {
      // Atualizar assigned_at para o sistema de repique
      await supabaseClient
        .from('leads')
        .update({ assigned_at: new Date().toISOString() })
        .eq('id', result.lead_id);

      // Adicionar tag "Lead Qualificado Pela IA"
      const { data: existingTag } = await supabaseClient
        .from('lead_tag_relations')
        .select('id')
        .eq('lead_id', result.lead_id)
        .eq('tag_id', TAG_QUALIFICADO_IA_ID)
        .maybeSingle();

      if (!existingTag) {
        const { error: tagError } = await supabaseClient
          .from('lead_tag_relations')
          .insert({ lead_id: result.lead_id, tag_id: TAG_QUALIFICADO_IA_ID });

        if (tagError) {
          console.error('Erro ao adicionar tag:', tagError);
        } else {
          console.log('Tag "Lead Qualificado Pela IA" adicionada ao lead:', result.lead_id);
        }
      }

      // Salvar notificação no histórico
      try {
        await supabaseClient.from('notifications').insert({
          user_id: nextUserId,
          company_id: EMPRESA_RKMF_ID,
          title: '🔔 Opa! Novo Lead!',
          body: `Corre lá, que o lead ${leadData.nome} está esperando seu atendimento!`,
          type: 'lead',
          lead_id: result.lead_id,
        });
      } catch (notifErr) {
        console.error('Erro ao salvar notificação:', notifErr);
      }

      try {
        await supabaseClient.functions.invoke('send-push-notification', {
          body: {
            userId: nextUserId,
            title: '🔔 Opa! Novo Lead!',
            body: `Corre lá, que o lead ${leadData.nome} está esperando seu atendimento!`,
            data: { leadId: result.lead_id, url: '/' }
          }
        });
        console.log('Notificação push enviada para:', nextUserId);
      } catch (notificationError) {
        console.error('Erro ao enviar notificação:', notificationError);
      }
    }

    // Buscar lead completo
    const { data: completeLead } = await supabaseClient
      .from('leads')
      .select('*, users:user_id (id, name, email)')
      .eq('id', result.lead_id)
      .single();

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
