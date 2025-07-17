import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Creating admin user in auth.users...')

    // Buscar o usuário na tabela public.users
    const { data: publicUser, error: publicUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'rhenan644@gmail.com')
      .single()

    if (publicUserError || !publicUser) {
      console.log('User not found in public.users table:', publicUserError)
      return new Response(
        JSON.stringify({ error: 'User not found in public.users table: ' + publicUserError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Found user in public.users:', publicUser.id)

    // Verificar se o usuário já existe no auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserByEmail('rhenan644@gmail.com')
    
    if (existingAuthUser.user) {
      console.log('User already exists in auth.users, deleting first...')
      await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.user.id)
    }

    // Criar o usuário no auth.users usando o mesmo ID
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      user_id: publicUser.id,
      email: 'rhenan644@gmail.com',
      password: 'gestor25',
      email_confirm: true,
      user_metadata: {
        name: 'Administrador'
      }
    })

    if (authError) {
      console.error('Error creating user in auth:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user in authentication: ' + authError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Admin user created successfully in auth.users:', authUser.user?.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        user_id: authUser.user?.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-admin-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})