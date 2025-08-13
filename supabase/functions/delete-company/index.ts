import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('Delete company function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user is super admin
    const isSuperAdmin = user.id === '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08' || 
                        user.id === '62926fc7-ffba-4a63-9bae-50f8845a1b67';

    if (!isSuperAdmin) {
      console.log('User is not super admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Access denied. Super admin required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Super admin verified');

    if (req.method !== 'DELETE') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get company ID from request body
    const { companyId } = await req.json();
    
    if (!companyId) {
      console.log('No company ID provided');
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Deleting company:', companyId);

    // Verify company exists first
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.log('Company not found:', companyError);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Company found:', company.name);

    // Delete related data first (in correct order to avoid foreign key constraints)
    
    // 1. Delete lead_tag_relations for leads of this company
    const { error: leadTagRelError } = await supabase
      .from('lead_tag_relations')
      .delete()
      .in('lead_id', 
        supabase
          .from('leads')
          .select('id')
          .eq('company_id', companyId)
      );

    if (leadTagRelError) {
      console.log('Error deleting lead tag relations:', leadTagRelError);
    }

    // 2. Delete lead_campaign relations
    const { error: leadCampaignError } = await supabase
      .from('lead_campaign')
      .delete()
      .in('lead_id', 
        supabase
          .from('leads')
          .select('id')
          .eq('company_id', companyId)
      );

    if (leadCampaignError) {
      console.log('Error deleting lead campaign relations:', leadCampaignError);
    }

    // 3. Delete lead_queue entries
    const { error: leadQueueError } = await supabase
      .from('lead_queue')
      .delete()
      .in('lead_id', 
        supabase
          .from('leads')
          .select('id')
          .eq('company_id', companyId)
      );

    if (leadQueueError) {
      console.log('Error deleting lead queue entries:', leadQueueError);
    }

    // 4. Delete leads
    const { error: leadsError } = await supabase
      .from('leads')
      .delete()
      .eq('company_id', companyId);

    if (leadsError) {
      console.log('Error deleting leads:', leadsError);
    }

    // 5. Delete imovel_midias for imoveis of this company
    const { error: imovelMidiasError } = await supabase
      .from('imovel_midias')
      .delete()
      .in('imovel_id', 
        supabase
          .from('imoveis')
          .select('id')
          .eq('company_id', companyId)
      );

    if (imovelMidiasError) {
      console.log('Error deleting imovel midias:', imovelMidiasError);
    }

    // 6. Delete imoveis
    const { error: imoveisError } = await supabase
      .from('imoveis')
      .delete()
      .eq('company_id', companyId);

    if (imoveisError) {
      console.log('Error deleting imoveis:', imoveisError);
    }

    // 7. Delete metas
    const { error: metasError } = await supabase
      .from('metas')
      .delete()
      .eq('company_id', companyId);

    if (metasError) {
      console.log('Error deleting metas:', metasError);
    }

    // 8. Delete logs
    const { error: logsError } = await supabase
      .from('logs')
      .delete()
      .eq('company_id', companyId);

    if (logsError) {
      console.log('Error deleting logs:', logsError);
    }

    // 9. Delete permissions for users of this company
    const { error: permissionsError } = await supabase
      .from('permissions')
      .delete()
      .in('user_id', 
        supabase
          .from('users')
          .select('id')
          .eq('company_id', companyId)
      );

    if (permissionsError) {
      console.log('Error deleting permissions:', permissionsError);
    }

    // 10. Delete equipes
    const { error: equipesError } = await supabase
      .from('equipes')
      .delete()
      .eq('company_id', companyId);

    if (equipesError) {
      console.log('Error deleting equipes:', equipesError);
    }

    // 11. Delete company_settings
    const { error: settingsError } = await supabase
      .from('company_settings')
      .delete()
      .eq('company_id', companyId);

    if (settingsError) {
      console.log('Error deleting company settings:', settingsError);
    }

    // 12. Delete users from this company
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('company_id', companyId);

    if (usersError) {
      console.log('Error deleting users:', usersError);
    }

    // 13. Finally, delete the company
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (deleteError) {
      console.log('Error deleting company:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete company' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Company deleted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Company "${company.name}" deleted successfully` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in delete-company function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});