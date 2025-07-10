import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCorretorRequest {
  email: string;
  name: string;
  telefone: string;
  permissions: string[];
  equipe_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, telefone, permissions, equipe_id }: CreateCorretorRequest = await req.json();

    console.log("Creating corretor with data:", { email, name, telefone, permissions, equipe_id });

    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'Mudar123', // Senha temporária
      email_confirm: false, // Usuário precisa confirmar email
      user_metadata: {
        name,
        telefone,
        role: 'corretor'
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error("Erro ao criar usuário de autenticação: " + authError.message);
    }

    console.log("Auth user created:", authUser.user?.id);

    // 2. Criar registro na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user!.id, // Usar o mesmo ID do auth
        name,
        email,
        telefone,
        password_hash: 'supabase_managed', // Indica que a senha é gerenciada pelo Supabase Auth
        role: 'corretor',
        status: 'pendente',
        equipe_id: equipe_id || null
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      // Reverter criação do usuário auth
      await supabase.auth.admin.deleteUser(authUser.user!.id);
      throw new Error("Erro ao criar registro do usuário: " + userError.message);
    }

    console.log("User record created:", userData);

    // 3. Criar permissões
    const permissionsData = {
      user_id: userData.id,
      can_view_all_leads: permissions.includes('can_view_all_leads'),
      can_invite_users: permissions.includes('can_invite_users'),
      can_manage_leads: permissions.includes('can_manage_leads'),
      can_view_reports: permissions.includes('can_view_reports'),
      can_manage_properties: permissions.includes('can_manage_properties'),
      can_manage_teams: permissions.includes('can_manage_teams'),
      can_access_configurations: permissions.includes('can_access_configurations')
    };

    const { error: permError } = await supabase
      .from('permissions')
      .insert(permissionsData);

    if (permError) {
      console.error("Error creating permissions:", permError);
      // Reverter criações
      await supabase.auth.admin.deleteUser(authUser.user!.id);
      await supabase.from('users').delete().eq('id', userData.id);
      throw new Error("Erro ao criar permissões: " + permError.message);
    }

    console.log("Permissions created successfully");

    // 4. Enviar email de confirmação usando Supabase Auth
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${supabaseUrl}/auth/v1/callback?next=${supabaseUrl}`
      }
    });

    if (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Não reverter aqui, pois o usuário foi criado com sucesso
      console.log("User created but email sending failed");
    } else {
      console.log("Confirmation email sent successfully");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Corretor criado com sucesso",
        user: userData,
        email_sent: !emailError
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in create-corretor function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);