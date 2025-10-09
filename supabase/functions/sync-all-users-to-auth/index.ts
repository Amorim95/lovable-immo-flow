import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
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

    console.log('Buscando todos os usuários da tabela users...');

    // Buscar todos os usuários da tabela users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      throw usersError;
    }

    console.log(`Encontrados ${users.length} usuários na tabela users`);

    const results = {
      total: users.length,
      created: [],
      alreadyExists: [],
      errors: []
    };

    // Para cada usuário, verificar se existe em auth.users e criar se necessário
    for (const user of users) {
      try {
        console.log(`\nProcessando usuário: ${user.email} (${user.name})`);

        // Verificar se já existe em auth.users
        const { data: existingAuthUser, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error(`Erro ao listar usuários auth para ${user.email}:`, listError);
          results.errors.push({
            email: user.email,
            error: listError.message
          });
          continue;
        }

        const authUserExists = existingAuthUser.users.find(u => u.email === user.email);

        if (authUserExists) {
          console.log(`✓ Usuário ${user.email} já existe em auth.users`);
          results.alreadyExists.push({
            email: user.email,
            name: user.name,
            auth_id: authUserExists.id
          });
          continue;
        }

        // Criar usuário em auth.users
        console.log(`Criando usuário ${user.email} em auth.users...`);
        
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: 'mudar123',
          email_confirm: true,
          user_metadata: {
            name: user.name
          }
        });

        if (createError) {
          console.error(`Erro ao criar ${user.email} em auth.users:`, createError);
          results.errors.push({
            email: user.email,
            error: createError.message
          });
          continue;
        }

        // Verificar se o ID do auth.users é diferente do ID da tabela users
        if (newAuthUser.user.id !== user.id) {
          console.log(`⚠️ IDs diferentes! Auth: ${newAuthUser.user.id}, Users table: ${user.id}`);
          console.log(`Atualizando ID do usuário na tabela users...`);
          
          // Atualizar o ID na tabela users para corresponder ao auth.users
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ id: newAuthUser.user.id })
            .eq('id', user.id);

          if (updateError) {
            console.error(`Erro ao atualizar ID do usuário ${user.email}:`, updateError);
            results.errors.push({
              email: user.email,
              error: `ID criado mas não sincronizado: ${updateError.message}`
            });
          } else {
            console.log(`✓ ID atualizado com sucesso`);
          }
        }

        console.log(`✓ Usuário ${user.email} criado com sucesso em auth.users`);
        results.created.push({
          email: user.email,
          name: user.name,
          auth_id: newAuthUser.user.id,
          temporary_password: 'mudar123'
        });

      } catch (error) {
        console.error(`Erro ao processar usuário ${user.email}:`, error);
        results.errors.push({
          email: user.email,
          error: error.message
        });
      }
    }

    console.log('\n=== RESUMO DA SINCRONIZAÇÃO ===');
    console.log(`Total de usuários: ${results.total}`);
    console.log(`Criados: ${results.created.length}`);
    console.log(`Já existiam: ${results.alreadyExists.length}`);
    console.log(`Erros: ${results.errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização concluída',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro geral na sincronização:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
