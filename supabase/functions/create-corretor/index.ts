import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log("Starting corretor creation:", { email, name, telefone, permissions, equipe_id });

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error("Email já está em uso");
    }

    // 1. Criar usuário no Supabase Auth primeiro
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'Mudar123',
      email_confirm: false,
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

    const authUserId = authUser.user!.id;
    console.log("Auth user created with ID:", authUserId);

    try {
      // 2. Criar registro na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          name,
          email,
          telefone,
          password_hash: 'supabase_managed',
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

      console.log("User record created:", userData.id);

      // 3. Criar permissões
      const permissionsData = {
        user_id: authUserId,
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
        throw new Error("Erro ao criar permissões: " + permError.message);
      }

      console.log("Permissions created successfully");

      // 4. Tentar enviar email (não crítico)
      try {
        const { error: emailError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email,
          options: {
            redirectTo: `${supabaseUrl}/auth/v1/callback`
          }
        });

        if (emailError) {
          console.error("Email sending failed:", emailError);
        } else {
          console.log("Confirmation email sent");
        }
      } catch (emailErr) {
        console.error("Email error (non-critical):", emailErr);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Corretor criado com sucesso",
          user: {
            id: authUserId,
            name,
            email,
            telefone,
            status: 'pendente'
          }
        }), 
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (error) {
      // Rollback: deletar usuário auth se algo deu errado
      console.log("Rolling back auth user due to error:", error);
      try {
        await supabase.auth.admin.deleteUser(authUserId);
        await supabase.from('users').delete().eq('id', authUserId);
        await supabase.from('permissions').delete().eq('user_id', authUserId);
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
      throw error;
    }

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