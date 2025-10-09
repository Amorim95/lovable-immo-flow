import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface SyncUserRequest {
  userId: string;
  temporaryPassword?: string;
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
      throw new Error('Apenas administradores podem sincronizar usuários');
    }

    // Parse request body
    const { userId, temporaryPassword }: SyncUserRequest = await req.json();

    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    const password = temporaryPassword || 'Mudar123';

    console.log(`Sincronizando usuário ${userId} para auth.users`);

    // Get the user from database
    const { data: userToSync, error: getUserError } = await supabaseClient
      .from('users')
      .select('id, email, name, company_id')
      .eq('id', userId)
      .single();

    if (getUserError || !userToSync) {
      console.error('Erro ao buscar usuário:', getUserError);
      throw new Error('Usuário não encontrado na tabela users');
    }

    // Verify same company (unless super admin)
    const isSuperAdmin = authUser.id === '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08' || 
                        authUser.id === '62926fc7-ffba-4a63-9bae-50f8845a1b67';
    
    if (!isSuperAdmin && requestingUser.company_id !== userToSync.company_id) {
      throw new Error('Você só pode sincronizar usuários da sua empresa');
    }

    console.log(`Criando usuário no auth: ${userToSync.name} (${userToSync.email})`);

    // Check if user already exists in auth
    const { data: existingAuthUser } = await supabaseClient.auth.admin.listUsers();
    const userExists = existingAuthUser?.users?.some(u => u.email === userToSync.email);

    if (userExists) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Usuário já existe no sistema de autenticação',
          alreadyExists: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Create user in auth.users with the SAME UUID
    const { data: newAuthUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email: userToSync.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: userToSync.name
      },
      // IMPORTANT: Use the same ID to maintain foreign key relationships
      id: userId
    });

    if (createError) {
      console.error('Erro ao criar usuário no auth:', createError);
      throw new Error(`Falha ao criar usuário no auth: ${createError.message}`);
    }

    console.log(`Usuário ${userId} sincronizado com sucesso no auth.users`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuário sincronizado com sucesso',
        temporaryPassword: password,
        user: {
          id: newAuthUser.user.id,
          email: newAuthUser.user.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro no sync-user-to-auth:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao sincronizar usuário'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
