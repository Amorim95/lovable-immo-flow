import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, data }: NotificationPayload = await req.json();

    console.log('Sending push notification to user:', userId);

    // Buscar subscription do usuário
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscriptionData) {
      console.log('No subscription found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'No subscription found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const subscription = subscriptionData.subscription;

    // Preparar payload da notificação
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/lovable-uploads/default-crm-logo.png',
      badge: '/lovable-uploads/default-crm-logo.png',
      data: data || {},
      requireInteraction: true,
      tag: 'lead-notification',
      vibrate: [200, 100, 200]
    });

    // Enviar push notification usando web-push
    try {
      // Import web-push dinamicamente
      const webpush = await import('https://esm.sh/web-push@3.6.7');
      
      webpush.setVapidDetails(
        'mailto:contato@clickimoveis.com.br',
        vapidPublicKey,
        vapidPrivateKey
      );

      await webpush.sendNotification(
        subscription,
        notificationPayload
      );

      console.log('Push notification sent successfully to user:', userId);

      return new Response(
        JSON.stringify({ success: true, message: 'Notification sent' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (pushError: any) {
      console.error('Error sending push notification:', pushError);
      
      // Se a subscription expirou ou é inválida, remover do banco
      if (pushError.statusCode === 410 || pushError.statusCode === 404) {
        console.log('Removing expired/invalid subscription for user:', userId);
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to send notification',
          error: pushError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
