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

    // Criar o lead sem user_id específico (será atribuído automaticamente pelo sistema)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome: nome.trim(),
        telefone: telefone.trim(),
        dados_adicionais: dados_adicionais || 'Lead do site público'
      })
      .select()
      .single()

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

    console.log('Lead criado com sucesso:', lead)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead criado com sucesso',
        leadId: lead.id 
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