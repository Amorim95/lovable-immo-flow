import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadWebhookData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
  company_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const leadData: LeadWebhookData = await req.json();

    // Validar dados obrigatórios (como antes)
    if (!leadData.nome || !leadData.telefone) {
      return new Response(
        JSON.stringify({ error: 'Nome e telefone são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Dados recebidos no webhook:', leadData);

    // Determinar empresa e usuário de destino
    let companyId = leadData.company_id;
    
    if (!companyId) {
      // Buscar primeira empresa (como antes, mas com maybeSingle)
      const { data: defaultCompany, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (companyError || !defaultCompany) {
        console.error('Erro ao obter empresa padrão:', companyError);
        return new Response(
          JSON.stringify({ error: 'Nenhuma empresa encontrada para processar o lead' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      companyId = defaultCompany.id;
      console.log('Empresa padrão encontrada:', companyId);
    }

    // Buscar próximo usuário no round-robin (fazendo manualmente)
    const { data: nextUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'ativo')
      .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle();

    if (userError || !nextUser) {
      console.error('Erro ao buscar usuário disponível:', userError);
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário ativo disponível para receber o lead' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Usuário selecionado:', nextUser.id);

    // Usar função robusta que previne race conditions com log detalhado
    console.log('Iniciando criação de lead com dados:', { 
      nome: leadData.nome, 
      telefone: leadData.telefone, 
      companyId, 
      userId: nextUser.id 
    });

    const { data: leadResult, error: leadError } = await supabase
      .rpc('create_lead_safe', {
        _nome: leadData.nome,
        _telefone: leadData.telefone,
        _dados_adicionais: leadData.dados_adicionais || null,
        _company_id: companyId,
        _user_id: nextUser.id
      })
      .maybeSingle();

    // Atualizar assigned_at para o lead criado (para o sistema de repique)
    if (leadResult && !leadResult.is_duplicate) {
      await supabase
        .from('leads')
        .update({ assigned_at: new Date().toISOString() })
        .eq('id', leadResult.lead_id);
    }

    console.log('Resultado da função create_lead_safe:', { leadResult, leadError });

    if (leadError) {
      console.error('Erro na função create_lead_safe:', leadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!leadResult) {
      console.error('Função create_lead_safe retornou resultado vazio');
      return new Response(
        JSON.stringify({ error: 'Erro interno - resultado vazio da função' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Lead processado:', leadResult);

    // Se é duplicata, retornar sucesso sem criar novo lead
    if (leadResult.is_duplicate) {
      console.log(`Lead duplicado detectado - retornando lead existente: ${leadResult.lead_id}`);
      
      // Buscar dados do lead existente para retornar
      const { data: existingLead, error: existingError } = await supabase
        .from('leads')
        .select('*, users!leads_user_id_fkey(name)')
        .eq('id', leadResult.lead_id)
        .maybeSingle();

      if (existingError) {
        console.error('Erro ao buscar lead existente:', existingError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          duplicate: true,
          message: leadResult.message,
          lead: existingLead,
          assigned_user: {
            id: existingLead?.user_id,
            name: existingLead?.users?.name || 'Usuário não encontrado'
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Lead criado com sucesso - buscar dados completos
    console.log('Lead criado com sucesso - buscando dados completos');
    const { data: newLead, error: newLeadError } = await supabase
      .from('leads')
      .select('*, users!leads_user_id_fkey(name)')
      .eq('id', leadResult.lead_id)
      .maybeSingle();

    if (newLeadError) {
      console.error('Erro ao buscar dados do lead criado:', newLeadError);
    }

    // Atualizar ultimo_lead_recebido do usuário que recebeu o lead
    console.log('Atualizando ultimo_lead_recebido do usuário:', nextUser.id);
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ ultimo_lead_recebido: new Date().toISOString() })
      .eq('id', nextUser.id);

    if (updateUserError) {
      console.error('Erro ao atualizar ultimo_lead_recebido:', updateUserError);
    }
    
    // Adicionar etiqueta "Lead Qualificado pela IA" ao lead criado
    console.log('Adicionando etiqueta ao lead:', leadResult.lead_id);
    const { error: tagError } = await supabase
      .from('lead_tag_relations')
      .insert({
        lead_id: leadResult.lead_id,
        tag_id: '89b0d175-7ac8-44b3-9f47-dec34353ccac'
      });
    
    if (tagError) {
      console.error('Erro ao adicionar etiqueta ao lead:', tagError);
    } else {
      console.log('Etiqueta "Lead Qualificado pela IA" adicionada com sucesso');
    }

    // Enviar notificação push para o usuário
    console.log('Enviando notificação push para o usuário:', nextUser.id);
    try {
      const notificationResponse = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: nextUser.id,
          title: 'Novo Lead - Click Imóveis',
          body: `Novo lead recebido: ${leadData.nome}`,
          data: {
            leadId: leadResult.lead_id,
            url: '/'
          }
        }
      });

      if (notificationResponse.error) {
        console.error('Erro ao enviar notificação push:', notificationResponse.error);
      } else {
        console.log('Notificação push enviada com sucesso');
      }
    } catch (notificationError) {
      console.error('Erro ao invocar função de notificação:', notificationError);
    }

    console.log('Processo completo - retornando resposta de sucesso');
    console.log('Lead final:', newLead);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead: newLead,
        assigned_user: {
          id: newLead?.user_id,
          name: newLead?.users?.name || 'Usuário não encontrado'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})