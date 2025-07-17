import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationRequest {
  email: string;
  name: string;
  tempPassword: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    if (!resend) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const { email, name, tempPassword }: InvitationRequest = await req.json();

    console.log('📧 Enviando convite para:', email);

    // Enviar email de convite
    const emailResponse = await resend.emails.send({
      from: "CRM System <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo ao CRM - Confirme sua conta",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Bem-vindo ao CRM System!</h1>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Sua conta foi criada com sucesso no nosso sistema CRM. Para começar a usar o sistema, você precisa confirmar seu email e definir uma nova senha.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Dados de acesso temporários:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Senha temporária:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          
          <p style="margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=placeholder&type=signup&redirect_to=${Deno.env.get('SITE_URL') || 'https://your-app.netlify.app'}/login" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Confirmar Email e Definir Senha
            </a>
          </p>
          
          <p><strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Se você não solicitou esta conta, pode ignorar este email.
          </p>
        </div>
      `,
    });

    console.log('✅ Email enviado com sucesso:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: 'Email de convite enviado com sucesso!' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Erro ao enviar convite:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao enviar email de convite', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})