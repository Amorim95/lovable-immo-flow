import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domínio é obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Verificando domínio: ${domain}`);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter o hostname atual do servidor
    const currentHostname = new URL(supabaseUrl).hostname.replace('loxpoehsddfearnzcdla.supabase.co', 'lovable.app');

    let verified = false;
    let error_message = '';

    try {
      // Verificar se o domínio aponta para o servidor correto
      // Fazemos uma requisição DNS lookup usando a API Cloudflare
      const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      });

      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json();
        console.log('DNS Response:', dnsData);

        // Verificar se existe um registro A ou CNAME que aponta para nosso servidor
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          const answers = dnsData.Answer;
          
          // Verificar se algum registro aponta para o domínio correto
          const pointsToCorrectServer = answers.some((answer: any) => {
            if (answer.type === 1) { // A record
              // Para Lovable, verificamos se aponta para o IP correto
              return answer.data === '185.158.133.1';
            } else if (answer.type === 5) { // CNAME record
              // Verificar se aponta para o domínio Lovable
              return answer.data.includes('lovable.app') || answer.data.includes(currentHostname);
            }
            return false;
          });

          if (pointsToCorrectServer) {
            verified = true;
          } else {
            error_message = 'DNS não aponta para o servidor correto';
          }
        } else {
          error_message = 'Nenhum registro DNS encontrado';
        }
      } else {
        error_message = 'Erro ao consultar DNS';
      }

      // Verificar também se o domínio responde corretamente (teste HTTP)
      if (verified) {
        try {
          const httpResponse = await fetch(`https://${domain}`, {
            method: 'HEAD',
            redirect: 'manual'
          });
          
          // Se conseguir fazer a requisição, consideramos que está funcionando
          console.log(`HTTP test for ${domain}: ${httpResponse.status}`);
        } catch (httpError) {
          console.log(`HTTP test failed for ${domain}:`, httpError);
          // Não marcar como erro se o DNS está correto mas HTTP ainda não funciona
          // O SSL pode estar ainda sendo provisionado
        }
      }

    } catch (dnsError) {
      console.error('Erro na verificação DNS:', dnsError);
      error_message = 'Erro na verificação DNS';
    }

    console.log(`Domínio ${domain} verificado: ${verified}`);

    return new Response(
      JSON.stringify({ 
        verified,
        domain,
        error_message: error_message || undefined,
        checked_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro na função verify-domain:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});