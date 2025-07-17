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

    console.log('🧪 Iniciando teste completo do sistema...')

    // 1. Verificar usuários existentes
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, name, email, role, status')
    
    console.log('👥 Usuários existentes:', users)

    // 2. Tentar criar um lead
    console.log('📝 Criando lead de teste...')
    const { data: leadData, error: leadError } = await supabaseClient
      .from('leads')
      .insert({
        nome: 'Lead Teste Sistema',
        telefone: '11999887766',
        dados_adicionais: 'Lead criado via função de teste',
        etapa: 'aguardando-atendimento'
      })
      .select('*, user_id')
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

    // 3. Verificar se foi adicionado à fila
    const { data: queueData, error: queueError } = await supabaseClient
      .from('lead_queue')
      .select('*')
      .eq('lead_id', leadData.id)

    console.log('📋 Dados da fila:', queueData)

    // 4. Buscar informações do corretor atribuído
    const { data: assignedUser, error: userError } = await supabaseClient
      .from('users')
      .select('name, email, role')
      .eq('id', leadData.user_id)
      .single()

    console.log('👤 Corretor atribuído:', assignedUser)

    // 5. Listar todos os leads após criação
    const { data: allLeads, error: leadsError } = await supabaseClient
      .from('leads')
      .select(`
        *,
        users!leads_user_id_fkey(name, email, role)
      `)
      .order('created_at', { ascending: false })

    console.log('📊 Todos os leads:', allLeads)

    return new Response(
      JSON.stringify({ 
        success: true,
        results: {
          users_count: users?.length || 0,
          created_lead: leadData,
          queue_entry: queueData,
          assigned_user: assignedUser,
          all_leads: allLeads
        },
        message: 'Teste completo executado com sucesso!'
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