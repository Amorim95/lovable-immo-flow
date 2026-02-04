import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { 
  ApplicationServer, 
  generateVapidKeys, 
  PushSubscription 
} from "jsr:@negrel/webpush@0.5.0";

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

// Helper to convert URL-safe Base64 to regular Base64
function urlSafeBase64ToBase64(str: string): string {
  return str.replace(/-/g, '+').replace(/_/g, '/');
}

// Helper to decode base64url string to Uint8Array
function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = urlSafeBase64ToBase64(base64String + padding);
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Convert raw EC key bytes to JWK format for import
function rawKeysToJwk(publicKeyBase64: string, privateKeyBase64: string): { publicKey: JsonWebKey; privateKey: JsonWebKey } {
  const publicKeyBytes = base64UrlToUint8Array(publicKeyBase64);
  const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64);
  
  // Public key is 65 bytes: 0x04 + 32 bytes X + 32 bytes Y
  // Remove the 0x04 prefix if present
  const xBytes = publicKeyBytes.slice(1, 33);
  const yBytes = publicKeyBytes.slice(33, 65);
  
  // Convert to base64url
  const x = btoa(String.fromCharCode(...xBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const y = btoa(String.fromCharCode(...yBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const d = btoa(String.fromCharCode(...privateKeyBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  return {
    publicKey: {
      kty: 'EC',
      crv: 'P-256',
      x,
      y,
      ext: true,
    },
    privateKey: {
      kty: 'EC',
      crv: 'P-256',
      x,
      y,
      d,
      ext: true,
    }
  };
}

// Import VAPID keys from raw base64url format
async function importVapidKeysFromRaw(publicKeyBase64: string, privateKeyBase64: string): Promise<CryptoKeyPair> {
  const jwk = rawKeysToJwk(publicKeyBase64, privateKeyBase64);
  
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk.publicKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );
  
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk.privateKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  );
  
  return { publicKey, privateKey };
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
      console.error('VAPID keys not configured');
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

    const userSubscription = subscriptionData.subscription as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    
    console.log('Subscription found for endpoint:', userSubscription.endpoint);

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

    try {
      // Import VAPID keys from raw base64url format
      console.log('Importing VAPID keys...');
      const vapidKeys = await importVapidKeysFromRaw(vapidPublicKey, vapidPrivateKey);
      console.log('VAPID keys imported successfully');

      // Create Application Server
      const appServer = await ApplicationServer.new({
        contactInformation: 'mailto:contato@clickimoveis.com.br',
        vapidKeys,
      });

      // Create push subscription
      const pushSubscription: PushSubscription = {
        endpoint: userSubscription.endpoint,
        keys: {
          p256dh: userSubscription.keys.p256dh,
          auth: userSubscription.keys.auth,
        },
      };

      // Subscribe and send message
      const subscriber = await appServer.subscribe(pushSubscription);
      
      console.log('Sending push message...');
      
      await subscriber.pushTextMessage(notificationPayload, {
        ttl: 86400,
        urgency: 'high',
      });

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
      
      // Se a subscription expirou, o erro contém "gone"
      if (pushError.message?.includes('gone') || pushError.message?.includes('410')) {
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
