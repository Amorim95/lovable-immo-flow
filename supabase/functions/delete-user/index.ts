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

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Deleting user:', user_id)

    // First, handle related data to avoid foreign key constraints
    
    // 1. Delete user permissions
    const { error: permissionsError } = await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('user_id', user_id)
    
    if (permissionsError) {
      console.error('Error deleting permissions:', permissionsError)
    }

    // 2. Update leads to remove user assignment (set to null or reassign)
    const { error: leadsError } = await supabaseAdmin
      .from('leads')
      .update({ user_id: null })
      .eq('user_id', user_id)
    
    if (leadsError) {
      console.error('Error updating leads:', leadsError)
    }

    // 3. Update lead_queue assignments
    const { error: queueError } = await supabaseAdmin
      .from('lead_queue')
      .update({ assigned_to: null, status: 'pending' })
      .eq('assigned_to', user_id)
    
    if (queueError) {
      console.error('Error updating lead queue:', queueError)
    }

    // 4. Delete user logs (or keep them for audit trail)
    const { error: logsError } = await supabaseAdmin
      .from('logs')
      .delete()
      .eq('user_id', user_id)
    
    if (logsError) {
      console.error('Error deleting logs:', logsError)
    }

    // Try to delete from auth.users, but continue even if user doesn't exist there
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    
    if (authError && authError.message !== 'User not found') {
      console.error('Error deleting from auth:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from authentication: ' + authError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    if (authError && authError.message === 'User not found') {
      console.log('User not found in auth.users, continuing with database deletion')
    }

    // Finally delete from public.users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user_id)

    if (userError) {
      console.error('Error deleting from users table:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from database' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User deleted successfully:', user_id)

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})