import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          company_id: string | null
          status: string
          role: string
          ultimo_lead_recebido: string | null
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting get-next-user function');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Set the auth token for this request
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User authenticated:', user.id);

    // Get current user's company_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('company_id, role, status')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      console.error('Error getting user info:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has permission to view this info (admin or gestor)
    if (!['admin', 'gestor', 'dono'].includes(currentUser.role)) {
      return new Response(
        JSON.stringify({ error: 'Permission denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User company_id:', currentUser.company_id);

    // Get the next user in round-robin for the company
    const { data: nextUser, error: nextUserError } = await supabase
      .from('users')
      .select('id, name, email, ultimo_lead_recebido')
      .eq('status', 'ativo')
      .eq('company_id', currentUser.company_id)
      .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })
      .limit(1)
      .single()

    if (nextUserError || !nextUser) {
      console.error('Error getting next user:', nextUserError);
      return new Response(
        JSON.stringify({ error: 'No active users found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Next user found:', nextUser.id, nextUser.name);

    // Get all users with their lead counts for context
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        ultimo_lead_recebido,
        leads:leads(count)
      `)
      .eq('status', 'ativo')
      .eq('company_id', currentUser.company_id)
      .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })

    if (allUsersError) {
      console.error('Error getting all users:', allUsersError);
    }

    const response = {
      nextUser: {
        id: nextUser.id,
        name: nextUser.name,
        email: nextUser.email,
        lastLeadReceived: nextUser.ultimo_lead_recebido
      },
      queueInfo: allUsers?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        lastLeadReceived: user.ultimo_lead_recebido,
        totalLeads: Array.isArray(user.leads) ? user.leads.length : user.leads?.count || 0
      })) || []
    }

    console.log('Response prepared:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})