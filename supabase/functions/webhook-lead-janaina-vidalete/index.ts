import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// IDs fixos para Janaina Vidalete - MAYS IMOB
const MAYS_IMOB_COMPANY_ID = 'c1a4e8e3-1367-45ac-a36a-061cfb768713';
const JANAINA_VIDALETE_USER_ID = '1313b833-4007-4b26-a4cc-4e68c9436123';

interface LeadData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate request method
    if (req.method !== 'POST') {
      console.log('Método não permitido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json() as LeadData;
    console.log('Dados recebidos:', JSON.stringify(body));

    // Validate required fields
    if (!body.nome || !body.telefone) {
      console.log('Campos obrigatórios faltando:', { nome: body.nome, telefone: body.telefone });
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: nome e telefone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number
    const telefoneLimpo = body.telefone.replace(/\D/g, '');
    console.log('Telefone limpo:', telefoneLimpo);

    // Verify Janaina Vidalete exists and is active
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, status, company_id')
      .eq('id', JANAINA_VIDALETE_USER_ID)
      .single();

    if (userError || !user) {
      console.error('Erro ao buscar usuária Janaina Vidalete:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuária Janaina Vidalete não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Usuária encontrada:', user.name, '- Status:', user.status);

    // Create lead using safe function
    const { data: leadResult, error: leadError } = await supabase.rpc('create_lead_safe', {
      _nome: body.nome,
      _telefone: telefoneLimpo,
      _dados_adicionais: body.dados_adicionais || null,
      _company_id: MAYS_IMOB_COMPANY_ID,
      _user_id: JANAINA_VIDALETE_USER_ID
    });

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = leadResult[0];
    console.log('Resultado create_lead_safe:', result);

    // If it's a new lead (not duplicate), update ultimo_lead_recebido and send push notification
    if (!result.is_duplicate) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ ultimo_lead_recebido: new Date().toISOString() })
        .eq('id', JANAINA_VIDALETE_USER_ID);

      if (updateError) {
        console.error('Erro ao atualizar ultimo_lead_recebido:', updateError);
      } else {
        console.log('ultimo_lead_recebido atualizado para Janaina Vidalete');
      }

      // Enviar notificação push para o usuário
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: JANAINA_VIDALETE_USER_ID,
            title: '🔔 Opa! Novo Lead!',
            body: `Corre lá, que o lead ${body.nome} está esperando seu atendimento!`,
            data: { leadId: result.lead_id, url: '/' }
          }
        });
        console.log('Notificação push enviada para Janaina Vidalete');
      } catch (notificationError) {
        console.error('Erro ao enviar notificação push:', notificationError);
      }
    }

    // Fetch complete lead data
    const { data: leadCompleto, error: fetchError } = await supabase
      .from('leads')
      .select(`
        *,
        user:users(id, name, email),
        tags:lead_tag_relations(tag:lead_tags(*))
      `)
      .eq('id', result.lead_id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar lead completo:', fetchError);
    }

    console.log('Lead processado com sucesso:', {
      lead_id: result.lead_id,
      is_duplicate: result.is_duplicate,
      assigned_to: 'Janaina Vidalete'
    });

    return new Response(
      JSON.stringify({
        success: true,
        is_duplicate: result.is_duplicate,
        message: result.is_duplicate 
          ? 'Lead já existente (duplicata ignorada)' 
          : 'Lead criado e atribuído para Janaina Vidalete',
        lead: leadCompleto || { id: result.lead_id },
        assigned_to: {
          id: JANAINA_VIDALETE_USER_ID,
          name: 'Janaina Vidalete'
        }
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
