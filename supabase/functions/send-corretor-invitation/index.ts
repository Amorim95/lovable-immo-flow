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

interface SendInvitationRequest {
  userId: string; // The ID of the user already created in auth.users
  email: string;
  name: string;
  temporaryPassword: string; // Temporary password to include in the email
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, name, temporaryPassword }: SendInvitationRequest = await req.json();

    console.log("Sending invitation email for user:", { userId, email, name });
    console.log("RESEND_API_KEY exists:", !!Deno.env.get("RESEND_API_KEY"));

    // Generate the confirmation link using Supabase's admin API
    const { data: { properties }, error: generateLinkError } = await supabase.auth.admin.generateLink({
      type: 'signup', // Use 'signup' type for new user confirmation
      email: email,
      options: {
        redirectTo: Deno.env.get('SITE_URL') || supabaseUrl // Redirect to your site URL after confirmation
      }
    });

    if (generateLinkError) {
      console.error("Error generating confirmation link:", generateLinkError);
      throw new Error("Erro ao gerar link de confirmação: " + generateLinkError.message);
    }

    const confirmationUrl = properties.emailRedirectTo;
    if (!confirmationUrl) {
        throw new Error("Confirmation URL was not generated.");
    }

    // Send custom email via Resend
    const emailResponse = await resend.emails.send({
      from: "CRM Imobiliária <onboarding@resend.dev>", // Replace with your verified sender domain
      to: [email],
      subject: "Bem-vindo ao CRM Click Imóveis - Confirme sua conta",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #007bff; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Bem-vindo ao Click Imóveis!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Olá <strong>${name}</strong>,</p>
            <p style="font-size: 16px; color: #333;">Sua conta foi criada com sucesso no sistema CRM Click Imóveis.</p>
            <p style="font-size: 16px; color: #333;">Para ativar sua conta e começar a usar o sistema, por favor, clique no botão abaixo:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${confirmationUrl}" 
                 style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; font-weight: bold;">
                Confirmar Minha Conta
              </a>
            </div>
            <p style="font-size: 16px; color: #333;">
              Após a confirmação, você poderá acessar o sistema com as seguintes credenciais:
            </p>
            <ul style="list-style: none; padding: 0; background-color: #f8f9fa; border-left: 5px solid #007bff; margin: 20px 0; padding: 15px;">
              <li style="margin-bottom: 10px;"><strong style="color: #555;">Email de Login:</strong> <span style="color: #007bff; font-weight: bold;">${email}</span></li>
              <li><strong style="color: #555;">Senha Provisória:</strong> <span style="color: #dc3545; font-weight: bold;">${temporaryPassword}</span></li>
            </ul>
            <p style="font-size: 14px; color: #666;">
              <strong>Recomendamos que você altere sua senha após o primeiro login por motivos de segurança.</strong>
            </p>
            <p style="font-size: 14px; color: #666;">
              Este link de confirmação expira em breve. Se você não solicitou esta conta, por favor, ignore este email.
            </p>
          </div>
          <div style="background-color: #f2f2f2; padding: 20px; text-align: center; font-size: 12px; color: #888;">
            <p>&copy; ${new Date().getFullYear()} Click Imóveis. Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Error sending email with Resend:", emailResponse.error);
      throw new Error("Erro ao enviar email de confirmação: " + emailResponse.error.message);
    }

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de convite enviado com sucesso."
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