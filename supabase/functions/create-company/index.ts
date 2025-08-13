import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Create Company Function Started ===');
    
    // Criar cliente Supabase com service role para admin operations
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

    // Verificar autenticação através do header JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair JWT do header (formato: "Bearer <token>")
    const jwt = authHeader.replace('Bearer ', '');
    
    // Usar cliente com JWT para verificar usuário
    const supabaseWithJWT = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: { Authorization: `Bearer ${jwt}` }
        }
      }
    );
    
    // Verificar se o usuário atual é válido
    const { data: { user }, error: userError } = await supabaseWithJWT.auth.getUser();
    if (userError || !user) {
      console.error('Erro ao verificar JWT:', userError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Usuário verificado:', user.id);

    // Verificar se é super admin usando service role
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('permissions')
      .select('is_super_admin')
      .eq('user_id', user.id)
      .single();

    if (permError || !permissions?.is_super_admin) {
      console.error('Usuário sem permissões de super admin:', permError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas super admins podem criar imobiliárias.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Permissões verificadas - Super admin confirmado');

    // Obter dados do body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Body recebido:', requestBody);
    } catch (bodyError) {
      console.error('Erro ao fazer parse do body:', bodyError);
      return new Response(
        JSON.stringify({ error: 'Body da requisição inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { companyName, adminName, adminEmail, adminPassword } = requestBody;
    
    console.log('Dados extraídos:', { companyName, adminName, adminEmail, passwordProvided: !!adminPassword });

    // Validar dados obrigatórios
    if (!companyName || !adminName || !adminEmail || !adminPassword) {
      console.error('Dados obrigatórios ausentes:', {
        companyName: !!companyName,
        adminName: !!adminName, 
        adminEmail: !!adminEmail,
        adminPassword: !!adminPassword
      });
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== Etapa 1: Criando empresa ===');
    // 1. Criar empresa
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName
      })
      .select()
      .single();

    if (companyError) {
      console.error('Erro ao criar empresa:', companyError);
      throw companyError;
    }

    console.log('Empresa criada:', company.id);

    try {
      console.log('=== Etapa 2: Verificando se email já existe ===');
      // 2. Verificar se o email já existe
      const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (checkError) {
        console.error('Erro ao verificar usuários existentes:', checkError);
        throw checkError;
      }

      const emailExists = existingUser.users.some(user => user.email === adminEmail);
      
      if (emailExists) {
        console.error('Email já cadastrado:', adminEmail);
        return new Response(
          JSON.stringify({ 
            error: `O email ${adminEmail} já está cadastrado no sistema. Use um email diferente.`,
            success: false 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('=== Etapa 3: Criando usuário admin ===');
      // 3. Criar usuário admin usando service role
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      });

      if (authError) {
        console.error('Erro ao criar usuário admin:', authError);
        throw authError;
      }

      console.log('Usuário admin criado:', authUser.user.id);

      console.log('=== Etapa 3: Criando perfil do usuário ===');
      // 3. Criar perfil do usuário
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          name: adminName,
          email: adminEmail,
          role: 'admin',
          status: 'ativo',
          company_id: company.id,
          password_hash: 'managed_by_auth'
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        throw profileError;
      }

      console.log('=== Etapa 4: Criando configurações vazias da empresa ===');
      // 4. Criar configurações iniciais vazias da empresa para onboarding
      const { error: settingsError } = await supabaseAdmin
        .from('company_settings')
        .insert({
          company_id: company.id, // Associar à empresa criada
          name: '', // Vazio para onboarding
          logo: null,
          site_title: '',
          site_description: '',
          site_phone: '',
          site_email: adminEmail, // Apenas o email do admin
          site_address: '',
          site_whatsapp: '',
          site_facebook: '',
          site_instagram: '',
          site_about: '',
          site_horario_semana: '9:00 às 18:00',
          site_horario_sabado: '9:00 às 15:00', 
          site_horario_domingo: 'Fechado',
          site_observacoes_horario: ''
        });

      if (settingsError) {
        console.warn('Erro ao criar configurações (não crítico):', settingsError);
      }

      console.log('=== Imobiliária criada com sucesso ===');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Imobiliária "${companyName}" criada com sucesso!`,
          company: company
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Erro durante criação, fazendo rollback da empresa:', error);
      // Rollback: deletar empresa se algo deu errado
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      
      // Se o usuário foi criado, tentar deletar também
      if (error.message && !error.message.includes('Erro ao criar usuário admin')) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser?.user?.id);
        } catch (deleteError) {
          console.error('Erro ao deletar usuário durante rollback:', deleteError);
        }
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: error
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})