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

    let authUserId: string | null = null;
    const temporaryPassword = 'Mudar123'; // Define temporary password here

    try {
      // First, try to get the user by email from Supabase Auth using listUsers
      console.log("Checking if email exists in Supabase Auth...");
      const { data: authUsers, error: getAuthUserError } = await supabase.auth.admin.listUsers();
      
      if (getAuthUserError) {
        console.error("Error listing auth users:", getAuthUserError);
        throw new Error("Erro ao verificar usuários de autenticação: " + getAuthUserError.message);
      }
      
      const existingAuthUser = authUsers.users?.find(user => user.email?.toLowerCase() === email.toLowerCase()) || null;

      if (existingAuthUser) {
          console.log("Email already exists in Supabase Auth:", existingAuthUser.id);
          // If the user exists in auth.users, check its status and also if it exists in public.users
          
          const { data: existingUserInPublic, error: existingPublicError } = await supabase
            .from('users')
            .select('id, email, status, created_at')
            .eq('id', existingAuthUser.id)
            .maybeSingle();

          if (existingPublicError && existingPublicError.code !== 'PGRST116') { // PGRST116 means no rows found
              console.error("Error checking existing public user linked to auth user:", existingPublicError);
              throw new Error("Erro ao verificar vínculo do usuário existente: " + existingPublicError.message);
          }

          if (existingUserInPublic) {
              console.log("Found existing user in public.users linked to auth user:", existingUserInPublic);
              // If user exists in both and is active or recent pending, return conflict
              const isOldPendingUser = existingUserInPublic.status === 'pendente' && 
                                       new Date(existingUserInPublic.created_at).getTime() < Date.now() - (10 * 60 * 1000); // 10 minutes threshold

              if (!isOldPendingUser && existingUserInPublic.status !== 'inativo') {
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
              } else if (isOldPendingUser) {
                  console.log("Existing user is an old pending user. Attempting to clean up and re-create.");
                  // Clean up orphaned public user and permissions, then allow re-creation of public user record.
                  await supabase.from('permissions').delete().eq('user_id', existingUserInPublic.id);
                  await supabase.from('users').delete().eq('id', existingUserInPublic.id);
                   // Auth user might still exist, we'll try to re-use it or just let it be.
                   authUserId = existingAuthUser.id; // Use existing auth user ID
               } else if (existingUserInPublic.status === 'inativo') {
                   console.log("Existing user is inactive. Reactivating and re-inviting.");
                   authUserId = existingAuthUser.id;
                  // Update public user to pending, and re-send invitation
                  await supabase.from('users').update({ status: 'pendente' }).eq('id', authUserId);
              }
           } else {
               console.log("User exists in Auth but not in public.users. Re-using Auth user and creating public record.");
               authUserId = existingAuthUser.id;
           }
      } else {
          // User does not exist in Auth, so create a new one
          console.log("Auth user does not exist. Creating new auth user...");
          const { data: newAuthUserResponse, error: newAuthError } = await supabase.auth.admin.createUser({
            email: email.toLowerCase(),
            password: temporaryPassword,
            email_confirm: false, // Control email sending manually
            user_metadata: {
              name,
              telefone,
              role,
              login_email: email.toLowerCase(),
              password_info: 'mudar123'
            }
          });

          if (newAuthError) {
            console.error("Error creating new auth user:", newAuthError);
            throw new Error("Erro ao criar novo usuário de autenticação: " + newAuthError.message);
          }
          authUserId = newAuthUserResponse.user!.id;
          console.log("New auth user created with ID:", authUserId);
      }

      // If we reached here, authUserId is set (either from existing or newly created)
      if (!authUserId) {
        throw new Error("Falha ao obter ID do usuário de autenticação.");
      }

      // 2. Create or update record in public.users table
      console.log("Creating/updating user record in public.users...");
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          id: authUserId,
          name,
          email: email.toLowerCase(),
          telefone: telefone || null,
          password_hash: 'supabase_managed', // Indicate managed by Supabase Auth
          role: role,
          status: 'pendente', // User starts as pending until email is confirmed
          equipe_id: equipe_id || null
        }, { onConflict: 'id' }) // Upsert based on ID if authUserId already existed
        .select()
        .single();

      if (userError) {
        console.error("User record creation/update failed:", userError);
        throw new Error("Erro ao criar/atualizar registro do usuário: " + userError.message);
      }

      console.log("User record created/updated:", userData.id);

      // 3. Create or update permissions based on role
      console.log("Creating/updating permissions...");
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
        .upsert(permissionsData, { onConflict: 'user_id' }); // Upsert based on user_id

      if (permError) {
        console.error("Error creating/updating permissions:", permError);
        throw new Error("Erro ao criar/atualizar permissões: " + permError.message);
      }

      console.log("Permissions created/updated successfully");

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
        if (authUserId) { // Only attempt to delete if auth user was actually created
            await supabase.auth.admin.deleteUser(authUserId);
            // Delete from public.users and permissions too, as they might have been partially created
            await supabase.from('users').delete().eq('id', authUserId);
            await supabase.from('permissions').delete().eq('user_id', authUserId);
            console.log("Rollback completed successfully.");
        }
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