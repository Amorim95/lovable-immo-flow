import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadMaysImobData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
}

// IDs fixos para MAYS IMOB
const MAYS_IMOB_COMPANY_ID = 'c1a4e8e3-1367-45ac-a36a-061cfb768713';
const FILA_EQUIPE_GERAL_ID = '429b4211-ea7a-49b0-a3ec-c258a8fbbbf0';

serve(async (req) => {
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
      console.log('Método não permitido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const leadData: LeadMaysImobData = await req.json();
    console.log('Dados recebidos:', JSON.stringify(leadData));

    // Validate required fields
    if (!leadData.nome || !leadData.telefone) {
      console.log('Campos obrigatórios faltando:', { nome: leadData.nome, telefone: leadData.telefone });
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: nome e telefone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', MAYS_IMOB_COMPANY_ID)
      .single();

    if (companyError || !company) {
      console.error('Empresa MAYS IMOB não encontrada:', companyError);
      return new Response(
        JSON.stringify({ error: 'Empresa MAYS IMOB não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Empresa encontrada:', company.name);

    // Verify team exists
    const { data: equipe, error: equipeError } = await supabase
      .from('equipes')
      .select('id, nome')
      .eq('id', FILA_EQUIPE_GERAL_ID)
      .eq('company_id', MAYS_IMOB_COMPANY_ID)
      .single();

    if (equipeError || !equipe) {
      console.error('Equipe "Fila Equipe Geral" não encontrada:', equipeError);
      return new Response(
        JSON.stringify({ error: 'Equipe "Fila Equipe Geral" não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Equipe encontrada:', equipe.nome);

    // Get next active user from "Fila Equipe Geral" team using round-robin
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, ultimo_lead_recebido')
      .eq('company_id', MAYS_IMOB_COMPANY_ID)
      .eq('equipe_id', FILA_EQUIPE_GERAL_ID)
      .eq('status', 'ativo')
      .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('Nenhum usuário ativo na equipe:', usersError);
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário ativo disponível na equipe "Fila Equipe Geral"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedUser = users[0];
    console.log('Usuário selecionado para o lead:', selectedUser.name, selectedUser.id);

    // Create lead using create_lead_safe function
    const { data: leadResult, error: leadError } = await supabase.rpc('create_lead_safe', {
      _nome: leadData.nome,
      _telefone: leadData.telefone,
      _dados_adicionais: leadData.dados_adicionais || null,
      _company_id: MAYS_IMOB_COMPANY_ID,
      _user_id: selectedUser.id
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

    // Update ultimo_lead_recebido for the selected user
    const { error: updateError } = await supabase
      .from('users')
      .update({ ultimo_lead_recebido: new Date().toISOString() })
      .eq('id', selectedUser.id);

    if (updateError) {
      console.error('Erro ao atualizar ultimo_lead_recebido:', updateError);
    }

    // Enviar notificação push para o usuário (apenas se não for duplicata)
    if (!result.is_duplicate) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: selectedUser.id,
            title: 'Novo Lead - MAYS IMOB',
            body: `Novo lead: ${leadData.nome}`,
            data: { leadId: result.lead_id, url: '/' }
          }
        });
        console.log('Notificação push enviada para:', selectedUser.name);
      } catch (notificationError) {
        console.error('Erro ao enviar notificação push:', notificationError);
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
      console.error('Erro ao buscar lead completo:', fetchError);
    }

    console.log('Lead processado com sucesso:', {
      lead_id: result.lead_id,
      is_duplicate: result.is_duplicate,
      assigned_to: selectedUser.name,
      equipe: equipe.nome
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: result.is_duplicate ? 'Lead já existe (duplicata)' : 'Lead criado com sucesso',
        is_duplicate: result.is_duplicate,
        lead: lead || { id: result.lead_id },
        assigned_to: {
          user_id: selectedUser.id,
          user_name: selectedUser.name,
          equipe: equipe.nome
        }
      }),
      { status: result.is_duplicate ? 200 : 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro inesperado no webhook-lead-mays-imob:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
