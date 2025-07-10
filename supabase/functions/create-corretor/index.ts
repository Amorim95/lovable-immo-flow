import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
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

    // 1. Primeiro criar registro na tabela users (sem depender do auth)
    const tempUserId = crypto.randomUUID();
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: tempUserId,
        name,
        email,
        telefone,
        password_hash: 'temp_hash', 
        role: 'corretor',
        status: 'pendente',
        equipe_id: equipe_id || null
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      throw new Error("Erro ao criar registro do usuário: " + userError.message);
    }

    console.log("User record created:", userData);

    // 2. Criar usuário no Supabase Auth usando o mesmo ID
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'Mudar123',
      email_confirm: false,
      user_metadata: {
        name,
        telefone,
        role: 'corretor',
        user_id: userData.id
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      // Reverter criação do usuário
      await supabase.from('users').delete().eq('id', userData.id);
      throw new Error("Erro ao criar usuário de autenticação: " + authError.message);
    }

    console.log("Auth user created:", authUser.user?.id);

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
      console.log("User created but email sending failed - this is not critical");
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