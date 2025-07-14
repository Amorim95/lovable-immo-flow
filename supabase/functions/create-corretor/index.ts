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

    // Basic validation
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

    console.log("Attempting to create corretor:", { email, name, telefone, role, equipe_id });

    // Check if user already exists in public.users to prevent orphaned records or duplicates
    console.log("Checking public.users table for existing user...");
    const { data: existingUserInPublic, error: existingPublicError } = await supabase
      .from('users')
      .select('id, email, status, created_at')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingPublicError && existingPublicError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error checking existing public user:", existingPublicError);
        throw new Error("Erro ao verificar usuário existente: " + existingPublicError.message);
    }

    if (existingUserInPublic) {
        console.log("Found existing user in public.users:", existingUserInPublic);
        // If an old pending user exists, assume it's an orphan from a failed previous attempt and clean up.
        const isOldPendingUser = existingUserInPublic.status === 'pendente' && 
                                 new Date(existingUserInPublic.created_at).getTime() < Date.now() - (10 * 60 * 1000); // 10 minutes threshold

        if (isOldPendingUser) {
            console.log("Cleaning up orphaned pending user:", existingUserInPublic.id);
            // Delete associated permissions and user record
            await supabase.from('permissions').delete().eq('user_id', existingUserInPublic.id);
            await supabase.from('users').delete().eq('id', existingUserInPublic.id);
            // Attempt to delete from auth.users as well if it exists, though it might not if orphaned
            try {
              await supabase.auth.admin.deleteUser(existingUserInPublic.id);
              console.log("Orphaned auth user also cleaned up.");
            } catch (e) {
              console.warn("Could not delete orphaned auth user (might not exist):", e.message);
            }
            console.log("Orphaned user cleaned up. Proceeding with new creation.");
        } else {
            console.log("User email already exists and is not an old pending orphan.");
            // If the email exists and is active or a recent pending, prevent re-creation.
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Este email já está em uso ou aguardando confirmação." 
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json", ...corsHeaders },
                }
            );
        }
    }

    // Attempt to create user in Supabase Auth first
    console.log("Creating auth user with temporary password...");
    const temporaryPassword = 'Mudar123'; // Define temporary password here

    const { data: authUserResponse, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: temporaryPassword, // Set a temporary password for the user
      email_confirm: false, // We will send a custom confirmation email
      user_metadata: {
        name,
        telefone,
        role,
        login_email: email.toLowerCase(),
        password_info: 'mudar123'
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      // Handle cases where email might already be in use in auth.users but not in public.users (e.g., deleted public.users entry)
      if (authError.message.includes('already exists') || authError.message.includes('User already registered')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Este email já está em uso no sistema de autenticação." 
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      throw new Error("Erro ao criar usuário de autenticação: " + authError.message);
    }

    const authUserId = authUserResponse.user!.id;
    console.log("Auth user created with ID:", authUserId);

    try {
      // 2. Create record in public.users table
      console.log("Creating user record in public.users...");
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          name,
          email: email.toLowerCase(),
          telefone: telefone || null,
          password_hash: 'supabase_managed', // Indicate managed by Supabase Auth
          role: role,
          status: 'pendente', // User starts as pending until email is confirmed
          equipe_id: equipe_id || null
        })
        .select()
        .single();

      if (userError) {
        console.error("User record creation failed:", userError);
        throw new Error("Erro ao criar registro do usuário: " + userError.message);
      }

      console.log("User record created:", userData.id);

      // 3. Create permissions based on role
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

      // Define permissions based on role
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
          can_access_configurations: false
        };
      } else if (role === 'corretor') {
        permissionsData = {
          ...permissionsData,
          can_manage_leads: true,
          can_access_configurations: false
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

      // 4. Trigger custom invitation email
      console.log("Invoking send-corretor-invitation Edge Function...");
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-corretor-invitation', {
          body: {
            userId: authUserId,
            email: email.toLowerCase(),
            name: name,
            temporaryPassword: temporaryPassword // Pass the temporary password
          }
        });

        if (emailError) {
          console.error("Error invoking send-corretor-invitation:", emailError);
          console.error("Email error details:", JSON.stringify(emailError, null, 2));
          // Log, but don't fail the entire function if email sending fails. The user is still created.
        } else if (emailData && !emailData.success) {
          console.error("send-corretor-invitation reported an error:", emailData.error);
        } else {
          console.log("Invitation email function successfully triggered.");
        }
      } catch (emailInvokeError) {
        console.error("Exception calling send-corretor-invitation:", emailInvokeError);
        // Don't fail the entire function if email sending fails
      }

      console.log("=== CREATE CORRETOR FUNCTION SUCCESS ===");
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Usuário criado com sucesso! Email de confirmação enviado.",
          user: {
            id: authUserId,
            name,
            email: email.toLowerCase(),
            telefone,
            role,
            status: 'pendente'
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (error) {
      // Rollback: delete auth user if something went wrong after auth user creation
      console.log("Error occurred after auth user creation, performing rollback...");
      try {
        await supabase.auth.admin.deleteUser(authUserId);
        await supabase.from('users').delete().eq('id', authUserId);
        await supabase.from('permissions').delete().eq('user_id', authUserId);
        console.log("Rollback completed successfully.");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
      throw error; // Re-throw the original error
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