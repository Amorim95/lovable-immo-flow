import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { nome, telefone, dados_adicionais } = await req.json()

    // Validar dados obrigatórios
    if (!nome || !telefone) {
      console.error('Dados obrigatórios não fornecidos:', { nome, telefone })
      return new Response(
        JSON.stringify({ error: 'Nome e telefone são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Criando lead público:', { nome, telefone, dados_adicionais })

    // Buscar primeira empresa
    const { data: defaultCompany, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (companyError || !defaultCompany) {
      console.error('Erro ao obter empresa padrão:', companyError)
      return new Response(
        JSON.stringify({ error: 'Nenhuma empresa encontrada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const companyId = defaultCompany.id

    // Buscar próximo usuário no round-robin
    const { data: nextUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'ativo')
      .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle()

    if (userError || !nextUser) {
      console.error('Erro ao buscar usuário disponível:', userError)
      return new Response(
        JSON.stringify({ error: 'Nenhum usuário ativo disponível' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Usar função segura contra duplicatas
    const { data: leadResult, error: leadError } = await supabase
      .rpc('create_lead_safe', {
        _nome: nome.trim(),
        _telefone: telefone.trim(),
        _dados_adicionais: dados_adicionais || 'Lead do site público',
        _company_id: companyId,
        _user_id: nextUser.id
      })
      .maybeSingle()

    if (leadError) {
      console.error('Erro ao criar lead:', leadError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!leadResult) {
      console.error('Função create_lead_safe retornou resultado vazio')
      return new Response(
        JSON.stringify({ error: 'Erro interno' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Se é duplicata, retornar sucesso sem criar novo
    if (leadResult.is_duplicate) {
      console.log(`Lead duplicado detectado: ${leadResult.lead_id}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          duplicate: true,
          message: 'Lead já existe',
          leadId: leadResult.lead_id 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Lead criado com sucesso:', leadResult.lead_id)

    // Atualizar ultimo_lead_recebido
    await supabase
      .from('users')
      .update({ ultimo_lead_recebido: new Date().toISOString() })
      .eq('id', nextUser.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead criado com sucesso',
        leadId: leadResult.lead_id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro na função create-public-lead:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})