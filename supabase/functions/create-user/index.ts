import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  name: string
  telefone?: string
  role: 'admin' | 'gestor' | 'corretor'
  equipeId?: string
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

    const { email, name, telefone, role, equipeId }: CreateUserRequest = await req.json()

    // Verificar se email já existe no auth.users
    const { data: authUsers, error: listError } = await supabaseClient.auth.admin.listUsers()
    
    if (!listError && authUsers?.users) {
      const existingAuthUser = authUsers.users.find(user => user.email === email)
      if (existingAuthUser) {
        console.log(`Email ${email} já existe no auth.users`)
        return new Response(
          JSON.stringify({ 
            error: `O email ${email} já está registrado no sistema. Por favor, use um email diferente.` 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Verificar se email já existe na tabela users
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      console.log(`Email ${email} já existe na tabela users`)
      return new Response(
        JSON.stringify({ 
          error: `O email ${email} já está cadastrado. Por favor, use um email diferente.` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    // Criar usuário no auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário de autenticação' }),
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
        email,
        name,
        telefone: telefone || null,
        role,
        equipe_id: equipeId && equipeId !== 'no-team' ? equipeId : null,
        status: 'pendente',
        password_hash: 'managed_by_auth'
      })
      .select()
      .single()

    if (userError) {
      // Rollback: deletar usuário do auth
      await supabaseClient.auth.admin.deleteUser(authUser.user!.id)
      console.error('User creation error:', userError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro do usuário' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Criar permissões baseadas no role
    const permissions = {
      admin: {
        can_view_all_leads: true,
        can_invite_users: true,
        can_manage_leads: true,
        can_view_reports: true,
        can_access_configurations: true,
        can_manage_teams: true,
        can_manage_properties: true
      },
      gestor: {
        can_view_all_leads: true,
        can_invite_users: true,
        can_manage_leads: true,
        can_view_reports: true,
        can_access_configurations: false,
        can_manage_teams: true,
        can_manage_properties: true
      },
      corretor: {
        can_view_all_leads: false,
        can_invite_users: false,
        can_manage_leads: false,
        can_view_reports: false,
        can_access_configurations: false,
        can_manage_teams: false,
        can_manage_properties: false
      }
    }

    const { error: permissionsError } = await supabaseClient
      .from('permissions')
      .insert({
        user_id: authUser.user!.id,
        ...permissions[role]
      })

    if (permissionsError) {
      // Rollback: deletar usuário
      await supabaseClient.auth.admin.deleteUser(authUser.user!.id)
      await supabaseClient.from('users').delete().eq('id', authUser.user!.id)
      
      console.error('Permissions error:', permissionsError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar permissões do usuário' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Enviar email de convite
    try {
      const inviteResponse = await supabaseClient.functions.invoke('send-user-invitation', {
        body: {
          email: userData.email,
          name: userData.name,
          tempPassword
        }
      });
      
      console.log('📧 Resultado do envio de email:', inviteResponse);
    } catch (emailError) {
      console.warn('⚠️ Erro ao enviar email de convite:', emailError);
      // Não falhar a criação do usuário se o email falhar
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: userData,
        tempPassword,
        message: 'Usuário criado com sucesso! Email de convite enviado.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})