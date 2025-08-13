import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadWebhookData {
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

    // Validar dados obrigatórios
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

    // Verificar se já existe um lead duplicado nos últimos 5 minutos
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .rpc('check_duplicate_lead', { _telefone: leadData.telefone, _time_window_minutes: 5 });

    if (duplicateError) {
      console.error('Erro ao verificar duplicatas:', duplicateError);
    } else if (duplicateCheck) {
      console.log(`Lead duplicado detectado para telefone: ${leadData.telefone}`);
      return new Response(
        JSON.stringify({ 
          error: 'Lead duplicado', 
          message: `Um lead com o telefone ${leadData.telefone} já foi registrado nos últimos 5 minutos.` 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter a primeira empresa ativa para atribuir ao lead (caso não seja especificada)
    const { data: defaultCompany, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .single();

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

    console.log('Empresa padrão encontrada:', defaultCompany.id);

    // Criar o lead com company_id para que o trigger round-robin funcione
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome: leadData.nome,
        telefone: leadData.telefone,
        dados_adicionais: leadData.dados_adicionais || null,
        etapa: 'aguardando-atendimento',
        atividades: [],
        company_id: defaultCompany.id
        // user_id será atribuído automaticamente pelo trigger round-robin
      })
      .select('*, users!leads_user_id_fkey(name)')
      .single();

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      
      // Verificar se é erro de duplicação
      if (leadError.code === 'P0001' && leadError.message.includes('Lead duplicado detectado')) {
        return new Response(
          JSON.stringify({ 
            error: 'Lead duplicado', 
            message: `Um lead com o telefone ${leadData.telefone} já foi registrado nos últimos 5 minutos.` 
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
          id: newLead.user_id,
          name: newLead.users?.name || 'Usuário não encontrado'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})