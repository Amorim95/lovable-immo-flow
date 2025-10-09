import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Obter o token do usuário do header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Obter leadId do corpo da requisição
    const { leadId } = await req.json();

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'leadId é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Deletando lead ${leadId} solicitado por ${user.id}`);

    // Buscar informações do lead
    const { data: lead, error: leadFetchError } = await supabaseClient
      .from('leads')
      .select('id, nome, telefone, company_id, user_id')
      .eq('id', leadId)
      .single();

    if (leadFetchError || !lead) {
      throw new Error('Lead não encontrado');
    }

    console.log(`Lead a deletar: ${lead.nome} (${lead.telefone})`);

    // Verificar permissão do usuário
    const { data: requestingUser, error: userError } = await supabaseClient
      .from('users')
      .select('id, role, company_id')
      .eq('id', user.id)
      .single();

    if (userError || !requestingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se o usuário tem permissão (admin, gestor, dono da mesma empresa)
    const isSuperAdmin = user.id === '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08' || 
                         user.id === '62926fc7-ffba-4a63-9bae-50f8845a1b67';
    const hasPermission = isSuperAdmin || 
                         (requestingUser.company_id === lead.company_id && 
                          ['admin', 'gestor', 'dono'].includes(requestingUser.role));

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para deletar este lead' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 1. Deletar relacionamentos de tags
    const { error: tagsError } = await supabaseClient
      .from('lead_tag_relations')
      .delete()
      .eq('lead_id', leadId);

    if (tagsError) {
      console.error('Erro ao deletar tags:', tagsError);
    } else {
      console.log('Tags deletadas');
    }

    // 2. Deletar relacionamentos de campanhas
    const { error: campaignsError } = await supabaseClient
      .from('lead_campaign')
      .delete()
      .eq('lead_id', leadId);

    if (campaignsError) {
      console.error('Erro ao deletar campanhas:', campaignsError);
    } else {
      console.log('Campanhas deletadas');
    }

    // 3. Deletar da fila de leads
    const { error: queueError } = await supabaseClient
      .from('lead_queue')
      .delete()
      .eq('lead_id', leadId);

    if (queueError) {
      console.error('Erro ao deletar da fila:', queueError);
    } else {
      console.log('Removido da fila');
    }

    // 4. Deletar logs relacionados ao lead
    const { error: logsError } = await supabaseClient
      .from('logs')
      .delete()
      .eq('entity_id', leadId)
      .eq('entity', 'lead');

    if (logsError) {
      console.error('Erro ao deletar logs:', logsError);
    } else {
      console.log('Logs deletados');
    }

    // 5. Finalmente, deletar o lead
    const { error: deleteError } = await supabaseClient
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (deleteError) {
      console.error('Erro ao deletar lead:', deleteError);
      throw new Error(`Falha ao deletar lead: ${deleteError.message}`);
    }

    console.log('Lead deletado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead deletado com sucesso',
        leadId: leadId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no delete-lead:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
