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

    // Verificar duplicatas com uma janela muito pequena para prevenir race conditions
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .rpc('check_duplicate_lead', { _telefone: leadData.telefone, _time_window_minutes: 1 });

    if (duplicateError) {
      console.error('Erro ao verificar duplicatas:', duplicateError);
    } else if (duplicateCheck) {
      console.log(`Lead duplicado detectado para telefone: ${leadData.telefone}`);
      return new Response(
        JSON.stringify({ 
          error: 'Lead duplicado', 
          message: `Um lead com o telefone ${leadData.telefone} já foi registrado no último minuto.` 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Criar o lead COM user_id definido (para evitar problemas de trigger)
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome: leadData.nome,
        telefone: leadData.telefone,
        dados_adicionais: leadData.dados_adicionais || null,
        etapa: 'aguardando-atendimento',
        atividades: [],
        company_id: companyId,
        user_id: nextUser.id // Definindo diretamente para evitar trigger
      })
      .select('*, users!leads_user_id_fkey(name)')
      .maybeSingle();

    // Atualizar ultimo_lead_recebido do usuário que recebeu o lead
    if (!leadError && newLead) {
      await supabase
        .from('users')
        .update({ ultimo_lead_recebido: new Date().toISOString() })
        .eq('id', nextUser.id);
      
      // Adicionar etiqueta "Lead Qualificado pela IA" ao lead criado
      const { error: tagError } = await supabase
        .from('lead_tag_relations')
        .insert({
          lead_id: newLead.id,
          tag_id: '89b0d175-7ac8-44b3-9f47-dec34353ccac'
        });
      
      if (tagError) {
        console.error('Erro ao adicionar etiqueta ao lead:', tagError);
        // Não falhar o webhook por causa da etiqueta, apenas logar o erro
      } else {
        console.log('Etiqueta "Lead Qualificado pela IA" adicionada ao lead:', newLead.id);
      }
    }

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      
      // Verificar se é erro de duplicação
      if (leadError.code === 'P0001' && leadError.message.includes('Lead duplicado detectado')) {
        return new Response(
          JSON.stringify({ 
            error: 'Lead duplicado', 
            message: `Um lead com o telefone ${leadData.telefone} já foi registrado no último minuto.` 
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Lead criado com sucesso:', newLead);

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