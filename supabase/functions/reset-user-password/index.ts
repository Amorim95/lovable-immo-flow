import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    );

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Resetando senha para: ${email}`);

    // Buscar usuário pelo email - usar paginação para encontrar todos
    let allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: pageData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage
      });
      
      if (listError) {
        console.error('Erro ao listar usuários:', listError);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar usuário' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      allUsers = allUsers.concat(pageData.users);
      hasMore = pageData.users.length === perPage;
      page++;
    }

    let user = allUsers.find(u => u.email === email);

    if (!user) {
      // Tentar criar o usuário no auth se ele existe em public.users
      console.log(`Usuário não encontrado no auth, tentando criar para: ${email}`);
      
      const { data: publicUser } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .eq('email', email)
        .maybeSingle();
      
      if (!publicUser) {
        return new Response(
          JSON.stringify({ error: `Usuário ${email} não encontrado` }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Criar no auth.users
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
        user_metadata: { name: publicUser.name }
      });

      if (createError) {
        console.error('Erro ao criar usuário no auth:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário no auth: ' + createError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Atualizar o ID em public.users para corresponder ao auth
      const oldId = publicUser.id;
      const newId = newAuthUser.user.id;
      
      if (oldId !== newId) {
        console.log(`Sincronizando IDs: ${oldId} -> ${newId}`);
        
        // Atualizar referências em outras tabelas
        await supabaseAdmin.from('leads').update({ user_id: newId }).eq('user_id', oldId);
        await supabaseAdmin.from('permissions').update({ user_id: newId }).eq('user_id', oldId);
        await supabaseAdmin.from('logs').update({ user_id: newId }).eq('user_id', oldId);
        await supabaseAdmin.from('lead_queue').update({ assigned_to: newId }).eq('assigned_to', oldId);
        await supabaseAdmin.from('push_subscriptions').update({ user_id: newId }).eq('user_id', oldId);
        
        // Atualizar o próprio registro do usuário
        await supabaseAdmin.from('users').update({ id: newId }).eq('id', oldId);
      }

      console.log(`✅ Usuário criado no auth e sincronizado: ${email}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Usuário ${email} criado no auth com senha: ${newPassword}`,
          created: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Atualizar senha do usuário
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword
      }
    );

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Senha atualizada com sucesso para ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Senha do usuário ${email} atualizada com sucesso para: ${newPassword}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
