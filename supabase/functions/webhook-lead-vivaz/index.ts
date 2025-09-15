import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadVivazData {
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
    const leadData: LeadVivazData = await req.json();
    console.log('Dados recebidos para Vivaz Imóveis:', leadData);

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

    // IMPORTANTE: Esta função é exclusiva para a Vivaz Imóveis - Rafael Lopes
    const EMPRESA_VIVAZ_ID = 'a74befa3-7bb0-4f17-9b11-7bfff9bf0ce6';
    const companyId = EMPRESA_VIVAZ_ID;

    // Validar se a empresa existe
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

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

    console.log('Empresa validada:', company.name);

    // Get next user for round-robin assignment
    const { data: nextUser } = await supabase.rpc('get_next_user_round_robin', {
      _company_id: companyId
    });

    if (!nextUser) {
      return new Response(
        JSON.stringify({ 
          error: 'Nenhum usuário ativo disponível para atribuição na Vivaz Imóveis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Usuário selecionado para receber o lead:', nextUser);

    // Create lead using safe function
    const { data: leadResult } = await supabase.rpc('create_lead_safe', {
      _nome: leadData.nome,
      _telefone: leadData.telefone,
      _dados_adicionais: leadData.dados_adicionais || '',
      _company_id: companyId,
      _user_id: nextUser
    });

    if (!leadResult || leadResult.length === 0) {
      throw new Error('Erro ao criar lead para Vivaz Imóveis');
    }

    const leadId = leadResult[0].lead_id;
    const isDuplicate = leadResult[0].is_duplicate;

    console.log('Lead para Vivaz Imóveis criado/encontrado:', { leadId, isDuplicate });

    // Update user's last lead received timestamp
    await supabase
      .from('users')
      .update({ ultimo_lead_recebido: new Date().toISOString() })
      .eq('id', nextUser);

    console.log('Timestamp de último lead atualizado para usuário:', nextUser);

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
        company: company.name,
        message: isDuplicate ? 'Lead Vivaz Imóveis já existia' : 'Lead Vivaz Imóveis criado com sucesso',
        isDuplicate
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook Vivaz Imóveis:', error);
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