import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const vapidPublicKeyJwk = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPublicKeyJwk) {
      console.error('VAPID_PUBLIC_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse the JWK and convert to base64url format for browser use
    const jwk = JSON.parse(vapidPublicKeyJwk);
    
    // The public key in base64url format is: 04 + x + y (uncompressed point format)
    // First, decode the x and y coordinates from base64url
    const xBytes = base64UrlToBytes(jwk.x);
    const yBytes = base64UrlToBytes(jwk.y);
    
    // Create uncompressed point (0x04 prefix + x + y)
    const uncompressedKey = new Uint8Array(65);
    uncompressedKey[0] = 0x04;
    uncompressedKey.set(xBytes, 1);
    uncompressedKey.set(yBytes, 33);
    
    // Convert to base64url
    const publicKeyBase64Url = bytesToBase64Url(uncompressedKey);

    console.log('Returning VAPID public key:', publicKeyBase64Url.substring(0, 20) + '...');

    return new Response(
      JSON.stringify({ publicKey: publicKeyBase64Url }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in get-vapid-public-key function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function base64UrlToBytes(base64Url: string): Uint8Array {
  // Add padding if needed
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
