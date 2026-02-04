import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadVivazZonaLesteData {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const leadData: LeadVivazZonaLesteData = await req.json();
    console.log('Dados recebidos para Zona Leste Rafael Vivaz:', leadData);

    // Validate required fields
    if (!leadData.nome || !leadData.telefone) {
      return new Response(
        JSON.stringify({ 
          error: 'Campos obrigatórios não fornecidos',
          details: 'Nome e telefone são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // IMPORTANTE: Esta função é exclusiva para a Vivaz Imóveis - Rafael Lopes - Equipe ZONA LESTE
    const EMPRESA_VIVAZ_ID = 'a74befa3-7bb0-4f17-9b11-7bfff9bf0ce6';
    const companyId = EMPRESA_VIVAZ_ID;

    // Validar se a empresa existe
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .maybeSingle();

    if (!company) {
      return new Response(
        JSON.stringify({ 
          error: 'Empresa Vivaz Imóveis não encontrada ou não autorizada para esta função' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Empresa validada para Zona Leste Rafael Vivaz:', company.name);

    // Buscar a equipe ZONA LESTE
    const { data: equipeZonaLeste } = await supabase
      .from('equipes')
      .select('id, nome')
      .eq('company_id', companyId)
      .eq('nome', 'ZONA LESTE')
      .maybeSingle();

    if (!equipeZonaLeste) {
      return new Response(
        JSON.stringify({ 
          error: 'Equipe ZONA LESTE não encontrada na Vivaz Imóveis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Equipe ZONA LESTE encontrada:', equipeZonaLeste.nome);

    // Buscar usuários ativos da equipe ZONA LESTE, ordenados por último lead recebido
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, name, ultimo_lead_recebido')
      .eq('company_id', companyId)
      .eq('equipe_id', equipeZonaLeste.id)
      .eq('status', 'ativo')
      .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })
      .limit(1);

    if (!usuarios || usuarios.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Nenhum usuário ativo disponível na equipe ZONA LESTE da Vivaz Imóveis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const nextUser = usuarios[0].id;
    console.log('Usuário da equipe ZONA LESTE selecionado para receber o lead:', usuarios[0].name, nextUser);

    // Create lead using safe function
    const { data: leadResult } = await supabase.rpc('create_lead_safe', {
      _nome: leadData.nome,
      _telefone: leadData.telefone,
      _dados_adicionais: leadData.dados_adicionais || '',
      _company_id: companyId,
      _user_id: nextUser
    });

    if (!leadResult || leadResult.length === 0) {
      throw new Error('Erro ao criar lead para Zona Leste Rafael Vivaz');
    }

    const leadId = leadResult[0].lead_id;
    const isDuplicate = leadResult[0].is_duplicate;

    console.log('Lead Zona Leste Rafael Vivaz criado/encontrado:', { leadId, isDuplicate });

    // Update user's last lead received timestamp
    await supabase
      .from('users')
      .update({ ultimo_lead_recebido: new Date().toISOString() })
      .eq('id', nextUser);

    console.log('Timestamp de último lead atualizado para usuário da ZONA LESTE:', nextUser);

    // Enviar notificação push para o usuário (apenas se não for duplicata)
    if (!isDuplicate) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: nextUser,
            title: 'Novo Lead - Vivaz ZONA LESTE',
            body: `Novo lead: ${leadData.nome}`,
            data: { leadId, url: '/' }
          }
        });
        console.log('Notificação push enviada para usuário ZONA LESTE:', nextUser);
      } catch (notificationError) {
        console.error('Erro ao enviar notificação push:', notificationError);
      }
    }

    // Get complete lead data to return
    const { data: completeLeadData } = await supabase
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
      .eq('id', leadId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        lead: completeLeadData,
        company: `${company.name} - Equipe ZONA LESTE`,
        message: isDuplicate ? 'Lead Zona Leste Rafael Vivaz já existia' : 'Lead Zona Leste Rafael Vivaz criado com sucesso',
        isDuplicate,
        team: 'ZONA LESTE'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook Zona Leste Rafael Vivaz:', error);
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