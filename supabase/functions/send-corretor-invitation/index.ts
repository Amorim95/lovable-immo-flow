import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  name: string;
  telefone: string;
  permissions: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, telefone, permissions }: InvitationRequest = await req.json();

    console.log("Creating corretor with data:", { email, name, telefone, permissions });

    // Criar hash da senha padrão
    const { data: hashedPassword, error: hashError } = await supabase.rpc('crypt_password', {
      password: 'Mudar123'
    });

    if (hashError) {
      console.error("Error hashing password:", hashError);
      throw new Error("Erro ao processar senha");
    }

    // Criar usuário no banco
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        telefone,
        password_hash: hashedPassword,
        role: 'corretor',
        status: 'pendente'
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user:", userError);
      throw new Error("Erro ao criar usuário: " + userError.message);
    }

    console.log("User created:", userData);

    // Criar permissões
    const permissionsData = {
      user_id: userData.id,
      can_view_all_leads: permissions.includes('can_view_all_leads'),
      can_invite_users: permissions.includes('can_invite_users')
    };

    const { error: permError } = await supabase
      .from('permissions')
      .insert(permissionsData);

    if (permError) {
      console.error("Error creating permissions:", permError);
      // Reverter criação do usuário
      await supabase.from('users').delete().eq('id', userData.id);
      throw new Error("Erro ao criar permissões: " + permError.message);
    }

    console.log("Permissions created successfully");

    // Gerar token de convite
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias para aceitar

    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
        status: 'pendente'
      });

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
    }

    // Enviar email de confirmação
    const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/confirm?token=${inviteToken}&type=invite&redirect_to=${supabaseUrl}`;
    
    const emailResponse = await resend.emails.send({
      from: "CRM System <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo ao CRM - Confirme sua conta",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Bem-vindo ao CRM!</h1>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Sua conta foi criada com sucesso. Para ativar sua conta, clique no link abaixo:</p>
          <div style="margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirmar Conta
            </a>
          </div>
          <p><strong>Suas credenciais de acesso:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Senha provisória:</strong> Mudar123</li>
          </ul>
          <p style="color: #666; font-size: 14px;">
            <strong>Importante:</strong> Altere sua senha após o primeiro login por segurança.
          </p>
          <p style="color: #666; font-size: 12px;">
            Este link expira em 7 dias. Se você não solicitou esta conta, ignore este email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Corretor criado e email enviado com sucesso",
        user: userData
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-corretor-invitation function:", error);
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