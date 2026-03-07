import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { text, postId, slug } = await req.json();
    if (!text || typeof text !== "string") {
      throw new Error("Text is required");
    }

    // Limit text to ~5000 chars for ElevenLabs
    const truncatedText = text.slice(0, 5000);

    // Use a Portuguese-friendly voice - Laura (multilingual)
    const voiceId = "FGY2WhTYpPnrIDTdsKH5"; // Laura

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: truncatedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error [${response.status}]: ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    // If postId is provided, save to Supabase Storage and update blog_posts
    if (postId && slug) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const fileName = `${slug}.mp3`;

      // Upload to storage (upsert)
      const { error: uploadError } = await supabase.storage
        .from("blog-audio")
        .upload(fileName, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Storage upload error: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("blog-audio")
        .getPublicUrl(fileName);

      const audioUrl = publicUrlData.publicUrl;

      // Update blog post with audio URL
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ audio_url: audioUrl })
        .eq("id", postId);

      if (updateError) {
        console.error("Update blog post error:", updateError);
        throw new Error(`Update error: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, audio_url: audioUrl }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fallback: return audio directly
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("blog-tts error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
