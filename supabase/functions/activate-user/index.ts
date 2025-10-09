import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface ActivateUserRequest {
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
      throw new Error('Apenas administradores podem ativar usuários');
    }

    // Parse request body
    const { userId }: ActivateUserRequest = await req.json();

    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    console.log(`Ativando usuário ${userId}`);

    // Get the user from database
    const { data: userToActivate, error: getUserError } = await supabaseClient
      .from('users')
      .select('id, email, name, company_id, status')
      .eq('id', userId)
      .single();

    if (getUserError || !userToActivate) {
      console.error('Erro ao buscar usuário:', getUserError);
      throw new Error('Usuário não encontrado na tabela users');
    }

    // Verify same company (unless super admin)
    const isSuperAdmin = authUser.id === '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08' || 
                        authUser.id === '62926fc7-ffba-4a63-9bae-50f8845a1b67';
    
    if (!isSuperAdmin && requestingUser.company_id !== userToActivate.company_id) {
      throw new Error('Você só pode ativar usuários da sua empresa');
    }

    console.log(`Atualizando status do usuário: ${userToActivate.name} (${userToActivate.email})`);

    // Update user status to 'ativo' using service role (bypasses RLS)
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ status: 'ativo' })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao ativar usuário:', updateError);
      throw new Error(`Falha ao ativar usuário: ${updateError.message}`);
    }

    console.log(`Usuário ${userId} ativado com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuário ativado com sucesso',
        user: {
          id: userToActivate.id,
          email: userToActivate.email,
          status: 'ativo'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro no activate-user:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao ativar usuário'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
