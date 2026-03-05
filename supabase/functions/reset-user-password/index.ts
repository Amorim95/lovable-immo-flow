import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    console.log(`Resetando senha para: ${normalizedEmail}`);

    const findAuthUserByEmail = async (targetEmail: string) => {
      for (let page = 1; page <= 10; page++) {
        const { data: pageData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });

        if (listError) {
          throw new Error(`Erro ao listar usuários auth: ${listError.message}`);
        }

        const authUser = pageData?.users?.find(
          (u) => u.email?.toLowerCase() === targetEmail
        );

        if (authUser) return authUser;
        if ((pageData?.users?.length ?? 0) < 1000) break;
      }

      return null;
    };

    // 1) Buscar usuário no public.users (fonte de verdade do CRM)
    const { data: publicUser } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (!publicUser) {
      return new Response(
        JSON.stringify({ error: `Usuário ${normalizedEmail} não encontrado` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Carregar usuário Auth pelo mesmo ID do CRM
    const { data: authByPublicId, error: getUserByIdError } = await supabaseAdmin.auth.admin.getUserById(publicUser.id);

    if (getUserByIdError || !authByPublicId?.user) {
      return new Response(
        JSON.stringify({ error: `Usuário Auth não encontrado para o ID do CRM (${publicUser.id}).` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authByPublicIdEmail = authByPublicId.user.email?.toLowerCase();

    // 3) Se o email do Auth (ID do CRM) estiver diferente, corrigir o email da identidade correta
    if (authByPublicIdEmail !== normalizedEmail) {
      const conflictingAuthUser = await findAuthUserByEmail(normalizedEmail);

      if (conflictingAuthUser && conflictingAuthUser.id !== publicUser.id) {
        const { data: mappedPublicUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', conflictingAuthUser.id)
          .maybeSingle();

        if (mappedPublicUser) {
          return new Response(
            JSON.stringify({ error: `Conflito de identidade: o email ${normalizedEmail} já está vinculado a outro usuário do CRM.` }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Removendo usuário auth órfão ${conflictingAuthUser.id} para liberar email ${normalizedEmail}`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(conflictingAuthUser.id);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: `Erro ao remover usuário auth órfão: ${deleteError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { error: emailUpdateError } = await supabaseAdmin.auth.admin.updateUserById(publicUser.id, {
        email: normalizedEmail,
        email_confirm: true,
      });

      if (emailUpdateError) {
        return new Response(
          JSON.stringify({ error: `Erro ao sincronizar email no Auth: ${emailUpdateError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4) Reset de senha no usuário Auth que corresponde ao ID do CRM
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      publicUser.id,
      { password: newPassword }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Senha atualizada com sucesso para ${normalizedEmail}`);
    return new Response(
      JSON.stringify({ success: true, message: `Senha atualizada com sucesso` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
