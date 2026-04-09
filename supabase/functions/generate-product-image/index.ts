import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, prompt } = await req.json();

    if (!productId || !prompt) {
      return new Response(JSON.stringify({ error: "productId and prompt required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("generated_images_cache")
      .select("image_url")
      .eq("product_id", productId)
      .single();

    if (cached?.image_url) {
      return new Response(JSON.stringify({ url: cached.image_url, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate with DALL-E
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.warn("OPENAI_API_KEY not set, cannot generate image");
      return new Response(JSON.stringify({ url: null, error: "No API key" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
      }),
    });

    if (!dalleResponse.ok) {
      const errText = await dalleResponse.text();
      console.error("DALL-E error:", dalleResponse.status, errText);
      return new Response(JSON.stringify({ url: null, error: "DALL-E generation failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dalleData = await dalleResponse.json();
    const imageUrl = dalleData.data?.[0]?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ url: null, error: "No image in response" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache in Supabase
    await supabase
      .from("generated_images_cache")
      .upsert({
        product_id: productId,
        image_url: imageUrl,
        prompt_used: prompt,
        generated_at: new Date().toISOString(),
      });

    return new Response(JSON.stringify({ url: imageUrl, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate product image error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
