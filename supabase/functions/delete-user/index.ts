import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface DeleteUserRequest {
  userId: string;
}

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
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error('Erro de autenticação:', authError);
      throw new Error('Não autorizado');
    }

    // Check if the authenticated user is admin or dono
    const { data: requestingUser, error: userError } = await supabaseClient
      .from('users')
      .select('role, company_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !requestingUser) {
      console.error('Erro ao buscar usuário:', userError);
      throw new Error('Usuário não encontrado');
    }

    if (!['admin', 'dono'].includes(requestingUser.role)) {
      throw new Error('Apenas administradores podem deletar usuários');
    }

    // Parse request body
    const { userId }: DeleteUserRequest = await req.json();

    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    console.log(`Deletando usuário ${userId} solicitado por ${authUser.id}`);

    // Get the user to be deleted
    const { data: userToDelete, error: getUserError } = await supabaseClient
      .from('users')
      .select('id, email, company_id, name')
      .eq('id', userId)
      .single();

    if (getUserError || !userToDelete) {
      console.error('Erro ao buscar usuário para deletar:', getUserError);
      throw new Error('Usuário não encontrado');
    }

    // Verify same company (unless super admin)
    const isSuperAdmin = authUser.id === '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08' || 
                        authUser.id === '62926fc7-ffba-4a63-9bae-50f8845a1b67';
    
    if (!isSuperAdmin && requestingUser.company_id !== userToDelete.company_id) {
      throw new Error('Você só pode deletar usuários da sua empresa');
    }

    console.log(`Usuário a deletar: ${userToDelete.name} (${userToDelete.email})`);

    // 1. PRIMEIRO: Deletar do Supabase Auth (antes de tudo)
    // Isso garante que o email ficará disponível para reuso
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.log('Aviso ao deletar do auth.users:', authDeleteError.message);
      // Não falha a operação se o usuário não existir no auth
    } else {
      console.log('Usuário deletado do auth.users');
    }

    // 2. Os leads permanecerão no sistema mas ficarão órfãos (user_id = NULL)
    // Isso é intencional para preservar o histórico de leads
    console.log('Leads do usuário ficarão órfãos após exclusão (user_id = NULL)');

    // 3. Deletar logs do usuário
    const { error: logsError } = await supabaseClient
      .from('logs')
      .delete()
      .eq('user_id', userId);

    if (logsError) {
      console.error('Erro ao deletar logs:', logsError);
    } else {
      console.log('Logs deletados');
    }

    // 4. Deletar permissões do usuário
    const { error: permissionsError } = await supabaseClient
      .from('permissions')
      .delete()
      .eq('user_id', userId);

    if (permissionsError) {
      console.error('Erro ao deletar permissões:', permissionsError);
    } else {
      console.log('Permissões deletadas');
    }

    // 5. Deletar subscrições push do usuário
    const { error: subscriptionsError } = await supabaseClient
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionsError) {
      console.error('Erro ao deletar subscrições:', subscriptionsError);
    } else {
      console.log('Subscrições deletadas');
    }

    // 6. Deletar da tabela users usando service role (bypassa RLS)
    const { error: deleteError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Erro ao deletar usuário da tabela users:', deleteError);
      throw new Error(`Falha ao deletar usuário: ${deleteError.message}`);
    }

    console.log(`Usuário ${userId} deletado com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuário deletado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro no delete-user:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao deletar usuário'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
