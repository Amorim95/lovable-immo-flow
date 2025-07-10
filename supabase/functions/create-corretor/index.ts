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
    console.log("=== CREATE CORRETOR FUNCTION START ===");
    
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const { email, name, telefone, permissions, equipe_id }: CreateCorretorRequest = requestBody;

    // Validação básica
    if (!email || !name) {
      console.log("Validation failed: missing email or name");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email e nome são obrigatórios" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Creating corretor:", { email, name, telefone, permissions, equipe_id });

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      console.log("Email already exists:", email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Este email já está em uso" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 1. Criar usuário no Supabase Auth
    console.log("Creating auth user...");
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true, // Confirmar email automaticamente
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
      console.log("Creating user record...");
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          name,
          email: email.toLowerCase(),
          telefone: telefone || null,
          password_hash: 'supabase_managed',
          role: 'corretor',
          status: 'ativo', // Ativar corretor automaticamente
          equipe_id: equipe_id || null
        })
        .select()
        .single();

      if (userError) {
        console.error("User record creation failed:", userError);
        throw new Error("Erro ao criar registro do usuário: " + userError.message);
      }

      console.log("User record created:", userData.id);

      // 3. Criar permissões
      console.log("Creating permissions...");
      const permissionsData = {
        user_id: authUserId,
        can_view_all_leads: false, // Removido da interface
        can_invite_users: permissions.includes('can_invite_users'),
        can_manage_leads: permissions.includes('can_manage_leads'),
        can_view_reports: permissions.includes('can_view_reports'),
        can_manage_properties: false, // Removido da interface
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

      // 4. Enviar email de boas-vindas (opcional - não bloqueia o processo)
      try {
        console.log("Attempting to send welcome email...");
        
        // Primeiro tentar gerar um link de reset de senha
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: email.toLowerCase(),
        });

        if (resetError) {
          console.error("Reset link generation failed:", resetError);
        } else {
          console.log("Reset link generated successfully");
          // Aqui você pode integrar com Resend ou outro serviço de email
          // Por enquanto, vamos apenas logar que o processo foi bem-sucedido
        }
      } catch (emailErr) {
        console.error("Email sending failed (non-critical):", emailErr);
      }

      console.log("=== CREATE CORRETOR FUNCTION SUCCESS ===");
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Corretor criado com sucesso",
          user: {
            id: authUserId,
            name,
            email: email.toLowerCase(),
            telefone,
            status: 'ativo'
          }
        }), 
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (error) {
      // Rollback: deletar usuário auth se algo deu errado
      console.log("Error occurred, performing rollback...");
      try {
        await supabase.auth.admin.deleteUser(authUserId);
        await supabase.from('users').delete().eq('id', authUserId);
        await supabase.from('permissions').delete().eq('user_id', authUserId);
        console.log("Rollback completed");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
      throw error;
    }

  } catch (error: any) {
    console.error("=== CREATE CORRETOR FUNCTION ERROR ===");
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro interno do servidor"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);