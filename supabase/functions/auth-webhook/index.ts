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

interface AuthWebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
  };
  schema: string;
  old_record: any;
}

const handler = async (req: Request): Promise<Response> => {
  try {
    console.log("=== AUTH WEBHOOK START ===");
    
    const payload: AuthWebhookPayload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    // Verificar se é um evento de confirmação de email ou login
    const isEmailConfirmed = payload.record.email_confirmed_at && 
                            (!payload.old_record?.email_confirmed_at || 
                             payload.old_record.email_confirmed_at !== payload.record.email_confirmed_at);
    
    const isFirstLogin = payload.record.last_sign_in_at && 
                        (!payload.old_record?.last_sign_in_at || 
                         payload.old_record.last_sign_in_at !== payload.record.last_sign_in_at);

    if (isEmailConfirmed || isFirstLogin) {
      console.log("User confirmed email or logged in:", payload.record.email);
      
      // Atualizar status do usuário para 'ativo'
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, status')
        .eq('id', payload.record.id)
        .single();

      if (userError) {
        console.error("Error finding user:", userError);
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (user.status === 'pendente') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ status: 'ativo' })
          .eq('id', payload.record.id);

        if (updateError) {
          console.error("Error updating user status:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update user status" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }

        console.log("User status updated to 'ativo' for:", payload.record.email);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("=== AUTH WEBHOOK ERROR ===");
    console.error("Error:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

serve(handler);