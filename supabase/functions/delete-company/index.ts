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

    if (req.method !== 'POST' && req.method !== 'DELETE') {
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

    // Get all lead IDs for this company first
    const { data: companyLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('company_id', companyId);
    
    const leadIds = companyLeads?.map(l => l.id) || [];
    console.log(`Found ${leadIds.length} leads to process`);

    // Get all imovel IDs for this company
    const { data: companyImoveis } = await supabase
      .from('imoveis')
      .select('id')
      .eq('company_id', companyId);
    
    const imovelIds = companyImoveis?.map(i => i.id) || [];
    console.log(`Found ${imovelIds.length} imoveis to process`);

    // Get all user IDs for this company
    const { data: companyUsers } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', companyId);
    
    const userIds = companyUsers?.map(u => u.id) || [];
    console.log(`Found ${userIds.length} users to process`);

    // Delete related data in correct order

    // 1. Delete lead_tag_relations for leads of this company
    if (leadIds.length > 0) {
      const { error: leadTagRelError } = await supabase
        .from('lead_tag_relations')
        .delete()
        .in('lead_id', leadIds);

      if (leadTagRelError) {
        console.log('Error deleting lead tag relations:', leadTagRelError);
      } else {
        console.log('Deleted lead tag relations');
      }
    }

    // 2. Delete lead_campaign relations
    if (leadIds.length > 0) {
      const { error: leadCampaignError } = await supabase
        .from('lead_campaign')
        .delete()
        .in('lead_id', leadIds);

      if (leadCampaignError) {
        console.log('Error deleting lead campaign relations:', leadCampaignError);
      } else {
        console.log('Deleted lead campaign relations');
      }
    }

    // 3. Delete lead_queue entries
    if (leadIds.length > 0) {
      const { error: leadQueueError } = await supabase
        .from('lead_queue')
        .delete()
        .in('lead_id', leadIds);

      if (leadQueueError) {
        console.log('Error deleting lead queue entries:', leadQueueError);
      } else {
        console.log('Deleted lead queue entries');
      }
    }

    // 4. Delete leads
    const { error: leadsError } = await supabase
      .from('leads')
      .delete()
      .eq('company_id', companyId);

    if (leadsError) {
      console.log('Error deleting leads:', leadsError);
    } else {
      console.log('Deleted leads');
    }

    // 5. Delete imovel_midias for imoveis of this company
    if (imovelIds.length > 0) {
      const { error: imovelMidiasError } = await supabase
        .from('imovel_midias')
        .delete()
        .in('imovel_id', imovelIds);

      if (imovelMidiasError) {
        console.log('Error deleting imovel midias:', imovelMidiasError);
      } else {
        console.log('Deleted imovel midias');
      }
    }

    // 6. Delete imoveis
    const { error: imoveisError } = await supabase
      .from('imoveis')
      .delete()
      .eq('company_id', companyId);

    if (imoveisError) {
      console.log('Error deleting imoveis:', imoveisError);
    } else {
      console.log('Deleted imoveis');
    }

    // 7. Delete metas
    const { error: metasError } = await supabase
      .from('metas')
      .delete()
      .eq('company_id', companyId);

    if (metasError) {
      console.log('Error deleting metas:', metasError);
    } else {
      console.log('Deleted metas');
    }

    // 8. Delete logs
    const { error: logsError } = await supabase
      .from('logs')
      .delete()
      .eq('company_id', companyId);

    if (logsError) {
      console.log('Error deleting logs:', logsError);
    } else {
      console.log('Deleted logs');
    }

    // 9. Delete permissions for users of this company
    if (userIds.length > 0) {
      const { error: permissionsError } = await supabase
        .from('permissions')
        .delete()
        .in('user_id', userIds);

      if (permissionsError) {
        console.log('Error deleting permissions:', permissionsError);
      } else {
        console.log('Deleted permissions');
      }
    }

    // 10. Delete equipes
    const { error: equipesError } = await supabase
      .from('equipes')
      .delete()
      .eq('company_id', companyId);

    if (equipesError) {
      console.log('Error deleting equipes:', equipesError);
    } else {
      console.log('Deleted equipes');
    }

    // 11. Delete company_settings
    const { error: settingsError } = await supabase
      .from('company_settings')
      .delete()
      .eq('company_id', companyId);

    if (settingsError) {
      console.log('Error deleting company settings:', settingsError);
    } else {
      console.log('Deleted company settings');
    }

    // 12. Delete company_access_control
    const { error: accessControlError } = await supabase
      .from('company_access_control')
      .delete()
      .eq('company_id', companyId);

    if (accessControlError) {
      console.log('Error deleting company access control:', accessControlError);
    } else {
      console.log('Deleted company access control');
    }

    // 13. Delete lead_stages
    const { error: leadStagesError } = await supabase
      .from('lead_stages')
      .delete()
      .eq('company_id', companyId);

    if (leadStagesError) {
      console.log('Error deleting lead stages:', leadStagesError);
    } else {
      console.log('Deleted lead stages');
    }

    // 14. Delete users from this company
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('company_id', companyId);

    if (usersError) {
      console.log('Error deleting users:', usersError);
    } else {
      console.log('Deleted users');
    }

    // 15. Finally, delete the company
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
