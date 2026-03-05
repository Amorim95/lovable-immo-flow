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

    console.log(`Resetando senha para: ${email}`);

    // 1. Buscar usuário em public.users primeiro (rápido)
    const { data: publicUser } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('email', email)
      .maybeSingle();

    if (!publicUser) {
      return new Response(
        JSON.stringify({ error: `Usuário ${email} não encontrado` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Tentar atualizar senha diretamente pelo ID do public.users
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      publicUser.id,
      { password: newPassword }
    );

    if (!updateError) {
      console.log(`✅ Senha atualizada com sucesso para ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: `Senha atualizada com sucesso` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Usuário não encontrado no auth pelo ID, tentando criar: ${updateError.message}`);

    // 3. Se falhou (usuário não existe no auth), criar no auth
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true,
      user_metadata: { name: publicUser.name }
    });

    if (createError) {
      // Se já existe com outro ID, buscar pelo email e atualizar
      if (createError.message.includes('already been registered')) {
        // Buscar nas primeiras páginas do auth
        for (let page = 1; page <= 10; page++) {
          const { data: pageData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
          const authUser = pageData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (authUser) {
            const { error: retryError } = await supabaseAdmin.auth.admin.updateUserById(
              authUser.id,
              { password: newPassword }
            );
            if (retryError) {
              return new Response(
                JSON.stringify({ error: 'Erro ao atualizar senha: ' + retryError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            // Sincronizar IDs se diferentes
            if (authUser.id !== publicUser.id) {
              console.log(`Sincronizando IDs: ${publicUser.id} -> ${authUser.id}`);
              await supabaseAdmin.from('leads').update({ user_id: authUser.id }).eq('user_id', publicUser.id);
              await supabaseAdmin.from('permissions').update({ user_id: authUser.id }).eq('user_id', publicUser.id);
              await supabaseAdmin.from('logs').update({ user_id: authUser.id }).eq('user_id', publicUser.id);
              await supabaseAdmin.from('lead_queue').update({ assigned_to: authUser.id }).eq('assigned_to', publicUser.id);
              await supabaseAdmin.from('push_subscriptions').update({ user_id: authUser.id }).eq('user_id', publicUser.id);
              await supabaseAdmin.from('users').update({ id: authUser.id }).eq('id', publicUser.id);
            }

            console.log(`✅ Senha atualizada via busca auth para ${email}`);
            return new Response(
              JSON.stringify({ success: true, message: `Senha atualizada com sucesso` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if ((pageData?.users?.length ?? 0) < 1000) break;
        }
      }

      return new Response(
        JSON.stringify({ error: 'Erro: ' + createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sincronizar IDs se necessário
    const oldId = publicUser.id;
    const newId = newAuthUser.user.id;
    if (oldId !== newId) {
      console.log(`Sincronizando IDs: ${oldId} -> ${newId}`);
      await supabaseAdmin.from('leads').update({ user_id: newId }).eq('user_id', oldId);
      await supabaseAdmin.from('permissions').update({ user_id: newId }).eq('user_id', oldId);
      await supabaseAdmin.from('logs').update({ user_id: newId }).eq('user_id', oldId);
      await supabaseAdmin.from('lead_queue').update({ assigned_to: newId }).eq('assigned_to', oldId);
      await supabaseAdmin.from('push_subscriptions').update({ user_id: newId }).eq('user_id', oldId);
      await supabaseAdmin.from('users').update({ id: newId }).eq('id', oldId);
    }

    console.log(`✅ Usuário criado no auth e senha definida: ${email}`);
    return new Response(
      JSON.stringify({ success: true, message: `Usuário criado no auth com senha definida`, created: true }),
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
