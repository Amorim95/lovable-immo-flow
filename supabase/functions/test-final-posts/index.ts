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

    console.log('🧪 TESTE FINAL: Verificando POSTs do sistema')

    // 1. TESTE DE CRIAÇÃO DE LEAD
    console.log('📝 Testando criação de lead...')
    const { data: leadData, error: leadError } = await supabaseClient
      .from('leads')
      .insert({
        nome: 'Lead POST Teste',
        telefone: '11998877665',
        dados_adicionais: 'Teste POST direto via edge function',
        etapa: 'aguardando-atendimento'
      })
      .select('*')
      .single()

    if (leadError) {
      console.error('❌ FALHA no POST de lead:', leadError)
      return new Response(
        JSON.stringify({ 
          success: false,
          step: 'lead_creation',
          error: leadError.message,
          details: leadError
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ POST de lead SUCESSO:', leadData)

    // 2. TESTE DE CRIAÇÃO DE CORRETOR (com email único)
    console.log('👤 Testando criação de corretor...')
    const testEmail = `corretor-${Date.now()}@teste.com`
    const tempPassword = 'teste123456'

    // Criar no auth.users
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: testEmail,
      password: tempPassword,
      email_confirm: false, // Para receber email de confirmação
      user_metadata: { name: 'Corretor Teste POST', role: 'corretor' }
    })

    if (authError) {
      console.error('❌ FALHA no POST auth corretor:', authError)
      return new Response(
        JSON.stringify({ 
          success: false,
          step: 'corretor_auth_creation',
          error: authError.message,
          details: authError
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ POST auth corretor SUCESSO:', authUser.user.email)

    // Criar na tabela users
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        name: 'Corretor Teste POST',
        role: 'corretor',
        status: 'pendente', // Vai para ativo quando confirmar email
        password_hash: 'managed_by_auth'
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ FALHA no POST user corretor:', userError)
      // Rollback auth
      await supabaseClient.auth.admin.deleteUser(authUser.user.id)
      return new Response(
        JSON.stringify({ 
          success: false,
          step: 'corretor_user_creation',
          error: userError.message,
          details: userError
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ POST user corretor SUCESSO:', userData.email)

    // Criar permissões
    const { error: permError } = await supabaseClient
      .from('permissions')
      .insert({
        user_id: authUser.user.id,
        can_view_all_leads: false,
        can_invite_users: false,
        can_manage_leads: false,
        can_view_reports: false,
        can_access_configurations: false,
        can_manage_teams: false,
        can_manage_properties: false
      })

    if (permError) {
      console.error('❌ FALHA no POST permissões:', permError)
      // Rollback
      await supabaseClient.auth.admin.deleteUser(authUser.user.id)
      await supabaseClient.from('users').delete().eq('id', authUser.user.id)
      return new Response(
        JSON.stringify({ 
          success: false,
          step: 'corretor_permissions_creation',
          error: permError.message,
          details: permError
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ POST permissões SUCESSO')

    // RESULTADO FINAL
    console.log('🎉 TODOS OS POSTS FUNCIONANDO!')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: '🎉 SISTEMA TOTALMENTE FUNCIONAL!',
        results: {
          lead_created: {
            id: leadData.id,
            nome: leadData.nome,
            telefone: leadData.telefone,
            user_id: leadData.user_id
          },
          corretor_created: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            status: userData.status,
            temp_password: tempPassword
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('💥 ERRO GERAL:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor', 
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})