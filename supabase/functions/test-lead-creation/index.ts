import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { nome, telefone, dados_adicionais } = await req.json()

    console.log('Teste: Criando lead com dados:', { nome, telefone, dados_adicionais })

    // Criar lead via Supabase client
    const { data: leadData, error: leadError } = await supabaseClient
      .from('leads')
      .insert({
        nome: nome || 'Lead de Teste',
        telefone: telefone || '11999887766',
        dados_adicionais: dados_adicionais || 'Teste via Edge Function',
        etapa: 'aguardando-atendimento'
      })
      .select()
      .single()

    if (leadError) {
      console.error('Erro ao criar lead:', leadError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar lead', details: leadError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Lead criado com sucesso:', leadData)

    // Verificar se foi adicionado à fila
    const { data: queueData, error: queueError } = await supabaseClient
      .from('lead_queue')
      .select('*')
      .eq('lead_id', leadData.id)

    console.log('Dados da fila:', queueData)

    return new Response(
      JSON.stringify({ 
        lead: leadData,
        queue: queueData,
        message: 'Lead criado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})