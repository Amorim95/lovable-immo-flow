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

    const { email, name, role } = await req.json()

    console.log('Teste: Criando corretor com dados:', { email, name, role })

    // Verificar se email já existe
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('email')
      .eq('email', email || 'teste@exemplo.com')
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email já existe, usando outro...' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Gerar dados de teste
    const testEmail = email || `teste-${Date.now()}@exemplo.com`
    const testName = name || 'Corretor Teste'
    const testRole = role || 'corretor'
    const tempPassword = 'teste123456'

    // Criar usuário no auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: testEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: testName, role: testRole }
    })

    if (authError) {
      console.error('Erro no auth:', authError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário de autenticação', details: authError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Criar registro na tabela users
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .insert({
        id: authUser.user!.id,
        email: testEmail,
        name: testName,
        role: testRole,
        status: 'ativo', // Ativar diretamente para teste
        password_hash: 'managed_by_auth'
      })
      .select()
      .single()

    if (userError) {
      console.error('Erro ao criar user:', userError)
      // Rollback
      await supabaseClient.auth.admin.deleteUser(authUser.user!.id)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro do usuário', details: userError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Criar permissões
    const permissions = testRole === 'corretor' ? {
      can_view_all_leads: false,
      can_invite_users: false,
      can_manage_leads: false,
      can_view_reports: false,
      can_access_configurations: false,
      can_manage_teams: false,
      can_manage_properties: false
    } : {
      can_view_all_leads: true,
      can_invite_users: true,
      can_manage_leads: true,
      can_view_reports: true,
      can_access_configurations: false,
      can_manage_teams: true,
      can_manage_properties: true
    }

    const { error: permissionsError } = await supabaseClient
      .from('permissions')
      .insert({
        user_id: authUser.user!.id,
        ...permissions
      })

    if (permissionsError) {
      console.error('Erro ao criar permissões:', permissionsError)
      // Rollback
      await supabaseClient.auth.admin.deleteUser(authUser.user!.id)
      await supabaseClient.from('users').delete().eq('id', authUser.user!.id)
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar permissões', details: permissionsError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Corretor criado com sucesso:', userData)

    return new Response(
      JSON.stringify({ 
        user: userData,
        tempPassword,
        message: 'Corretor criado com sucesso'
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