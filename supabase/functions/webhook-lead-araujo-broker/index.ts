import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadAraujoData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Only allow POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const leadData: LeadAraujoData = await req.json();
    console.log('Lead Araújo Broker recebido:', leadData);

    // Validate required fields
    if (!leadData.nome || !leadData.telefone) {
      return new Response(
        JSON.stringify({ error: 'Nome e telefone são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Company ID for Araújo Broker
    const EMPRESA_ARAUJO_ID = '6959ef94-3614-49be-aac8-544e6757e3f4';

    // Validate company exists
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('id, name')
      .eq('id', EMPRESA_ARAUJO_ID)
      .single();

    if (companyError || !company) {
      console.error('Erro ao buscar empresa:', companyError);
      return new Response(
        JSON.stringify({ error: 'Empresa Araújo Broker não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Empresa encontrada:', company.name);

    // Get next user using round-robin
    const { data: nextUserId, error: userError } = await supabaseClient
      .rpc('get_next_user_round_robin', { _company_id: EMPRESA_ARAUJO_ID });

    if (userError || !nextUserId) {
      console.error('Erro ao buscar próximo usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário ativo disponível para atribuição' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Usuário selecionado:', nextUserId);

    // Create lead using safe function
    const { data: leadResult, error: leadError } = await supabaseClient
      .rpc('create_lead_safe', {
        _nome: leadData.nome,
        _telefone: leadData.telefone,
        _dados_adicionais: leadData.dados_adicionais || null,
        _company_id: EMPRESA_ARAUJO_ID,
        _user_id: nextUserId
      });

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = leadResult[0];
    console.log('Resultado da criação do lead:', result);

    // Enviar notificação push para o usuário (apenas se não for duplicata)
    if (!result.is_duplicate) {
      try {
        await supabaseClient.functions.invoke('send-push-notification', {
          body: {
            userId: nextUserId,
            title: 'Novo Lead - Araújo Broker',
            body: `Novo lead: ${leadData.nome}`,
            data: { leadId: result.lead_id, url: '/' }
          }
        });
        console.log('Notificação push enviada para usuário:', nextUserId);
      } catch (notificationError) {
        console.error('Erro ao enviar notificação push:', notificationError);
      }
    }

    // Fetch complete lead data
    const { data: completeLead, error: fetchError } = await supabaseClient
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
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro inesperado:', error);
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
