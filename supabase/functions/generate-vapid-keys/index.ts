import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateVapidKeys, exportVapidKeys } from "jsr:@negrel/webpush@0.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating new VAPID keys...');
    
    // Generate new VAPID keys with extractable = true
    const vapidKeys = await generateVapidKeys({ extractable: true });
    
    // Export them to JWK format
    const exportedKeys = await exportVapidKeys(vapidKeys);
    
    console.log('VAPID keys generated successfully');
    console.log('Public Key:', exportedKeys.publicKey);
    console.log('Private Key:', exportedKeys.privateKey);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'New VAPID keys generated. Update VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets with these values.',
        keys: exportedKeys
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error generating VAPID keys:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
