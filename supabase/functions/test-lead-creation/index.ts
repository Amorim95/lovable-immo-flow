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

    console.log('🧪 Testando criação de lead...')

    // Buscar um usuário ativo para testar
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, name, email, role, status')
      .eq('status', 'ativo')
      .limit(1)

    if (usersError || !users || users.length === 0) {
      throw new Error('Nenhum usuário ativo encontrado')
    }

    const testUser = users[0]
    console.log('👤 Usando usuário para teste:', testUser)

    // Criar lead usando o usuário encontrado (simulando auth.uid())
    const { data: leadData, error: leadError } = await supabaseClient
      .from('leads')
      .insert({
        nome: 'Lead Teste Final',
        telefone: '11987654321',
        dados_adicionais: 'Lead criado no teste final do sistema',
        etapa: 'aguardando-atendimento'
        // Não definindo user_id para testar o trigger
      })
      .select('*')
      .single()

    if (leadError) {
      console.error('❌ Erro ao criar lead:', leadError)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar lead', 
          details: leadError,
          step: 'lead_creation'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Lead criado:', leadData)

    // Verificar se foi adicionado à fila
    const { data: queueData, error: queueError } = await supabaseClient
      .from('lead_queue')
      .select('*')
      .eq('lead_id', leadData.id)

    console.log('📋 Dados da fila:', queueData)

    // Buscar informações do usuário atribuído
    if (leadData.user_id) {
      const { data: assignedUser, error: userError } = await supabaseClient
        .from('users')
        .select('name, email, role')
        .eq('id', leadData.user_id)
        .single()

      console.log('👤 Usuário atribuído:', assignedUser)
    }

    // Verificar logs do lead
    const { data: logs, error: logsError } = await supabaseClient
      .from('logs')
      .select('*')
      .eq('entity_id', leadData.id)

    console.log('📝 Logs do lead:', logs)

    return new Response(
      JSON.stringify({ 
        success: true,
        results: {
          created_lead: leadData,
          queue_entry: queueData,
          logs: logs,
          test_user: testUser
        },
        message: 'Teste de criação de lead executado com sucesso!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('💥 Erro geral na função:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})