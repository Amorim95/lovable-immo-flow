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
  role: 'admin' | 'gestor' | 'corretor';
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
    
    const { email, name, telefone, role, equipe_id }: CreateCorretorRequest = requestBody;

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

    console.log("Creating corretor:", { email, name, telefone, role, equipe_id });

    // Verificar se email já existe no auth.users (mais confiável)
    console.log("Checking if email exists in auth...");
    const { data: authUserCheck, error: authCheckError } = await supabase.auth.admin.listUsers();
    
    if (authCheckError) {
      console.error("Error checking auth users:", authCheckError);
    } else {
      const existingAuthUser = authUserCheck.users?.find(user => 
        user.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (existingAuthUser) {
        console.log("Email already exists in auth:", email);
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
    }

    // Verificar na tabela users e limpar órfãos se necessário
    console.log("Checking users table...");
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, status, created_at')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      console.log("Found existing user in users table:", existingUser);
      
      // Se o usuário está pendente há mais de 5 minutos, provavelmente é órfão
      const isOldPendingUser = existingUser.status === 'pendente' && 
        new Date(existingUser.created_at).getTime() < Date.now() - (5 * 60 * 1000);
      
      if (isOldPendingUser) {
        console.log("Cleaning up orphaned pending user...");
        // Limpar usuário órfão
        await supabase.from('permissions').delete().eq('user_id', existingUser.id);
        await supabase.from('users').delete().eq('id', existingUser.id);
        console.log("Orphaned user cleaned up");
      } else {
        // Usuário válido existe
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
    }

    // 1. Criar usuário no Supabase Auth (sem confirmar email automaticamente)
    console.log("Creating auth user...");
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: 'mudar123', // Senha padrão
      email_confirm: false, // NÃO confirmar automaticamente para enviar email
      user_metadata: {
        name,
        telefone,
        role
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
          role: role,
          status: 'ativo', // Ativar usuário automaticamente
          equipe_id: equipe_id || null
        })
        .select()
        .single();

      if (userError) {
        console.error("User record creation failed:", userError);
        throw new Error("Erro ao criar registro do usuário: " + userError.message);
      }

      console.log("User record created:", userData.id);

      // 3. Criar permissões baseadas no cargo
      console.log("Creating permissions...");
      let permissionsData = {
        user_id: authUserId,
        can_view_all_leads: false,
        can_invite_users: false,
        can_manage_leads: false,
        can_view_reports: false,
        can_manage_properties: false,
        can_manage_teams: false,
        can_access_configurations: false
      };

      // Definir permissões baseadas no cargo
      if (role === 'admin') {
        permissionsData = {
          ...permissionsData,
          can_view_all_leads: true,
          can_invite_users: true,
          can_manage_leads: true,
          can_view_reports: true,
          can_manage_properties: true,
          can_manage_teams: true,
          can_access_configurations: true
        };
      } else if (role === 'gestor') {
        permissionsData = {
          ...permissionsData,
          can_manage_leads: true,
          can_view_reports: true,
          can_manage_teams: true,
          can_access_configurations: false // Só acesso às próprias configurações
        };
      } else if (role === 'corretor') {
        permissionsData = {
          ...permissionsData,
          can_manage_leads: true, // Só leads próprios
          can_access_configurations: false // Só acesso às próprias configurações
        };
      }

      const { error: permError } = await supabase
        .from('permissions')
        .insert(permissionsData);

      if (permError) {
        console.error("Error creating permissions:", permError);
        throw new Error("Erro ao criar permissões: " + permError.message);
      }

      console.log("Permissions created successfully");

      // 4. Usar Supabase para enviar email de confirmação nativo
      try {
        console.log("Sending Supabase confirmation email...");
        
        // Usar o método nativo do Supabase para gerar link de confirmação
        const { data: confirmationData, error: confirmationError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: email.toLowerCase(),
          password: 'mudar123',
          options: {
            data: {
              name,
              telefone,
              role,
              welcome_message: `Olá ${name}! Bem-vindo ao Sistema CRM. Seu login é: ${email.toLowerCase()} e sua senha provisória é: mudar123`
            }
          }
        });

        if (confirmationError) {
          console.error("Supabase confirmation email failed:", confirmationError);
        } else {
          console.log("Supabase confirmation email link generated successfully");
          
          // Confirmar o email automaticamente após gerar o link
          const { error: confirmError } = await supabase.auth.admin.updateUserById(authUserId, {
            email_confirm: true
          });
          
          if (confirmError) {
            console.error("Error confirming email:", confirmError);
          }
        }
      } catch (emailErr) {
        console.error("Supabase email generation failed (non-critical):", emailErr);
      }

      console.log("=== CREATE CORRETOR FUNCTION SUCCESS ===");
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Usuário criado com sucesso! Email de confirmação enviado pelo Supabase.",
          user: {
            id: authUserId,
            name,
            email: email.toLowerCase(),
            telefone,
            role,
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