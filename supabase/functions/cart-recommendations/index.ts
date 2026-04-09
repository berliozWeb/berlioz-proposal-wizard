import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_RECS = [
  { productName: "Café y Té Berlioz", reason: "El complemento perfecto para cualquier evento corporativo", urgencyMessage: "Incluido en el 80% de nuestros pedidos" },
  { productName: "Surtido Golden Box", reason: "Nuestro bestseller — mix premium de mini sándwiches y wraps", urgencyMessage: "Solo 5 disponibles para esta semana" },
  { productName: "Agua Natural (12 pzas)", reason: "Hidratación esencial para tu equipo", urgencyMessage: "Envío gratis al agregar bebidas" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cartItems, cartTotal } = await req.json();

    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ recommendations: FALLBACK_RECS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try AI recommendations
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ recommendations: FALLBACK_RECS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get real product names from DB for grounding
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("productos")
      .select("nombre, categoria, precio")
      .eq("activo", true)
      .in("tipo", ["simple", "variable"])
      .limit(100);

    const productCatalog = products?.map((p) => `${p.nombre} (${p.categoria}, $${p.precio})`).join("\n") || "";

    const cartDescription = cartItems
      .map((i: any) => `${i.name} (${i.category || "sin categoría"}, $${i.price} x ${i.qty})`)
      .join(", ");

    const systemPrompt = `Eres el motor de recomendaciones de Berlioz, catering gourmet franco-mexicano en CDMX. Dado el carrito actual del cliente, sugiere exactamente 3 productos complementarios que aumenten el ticket promedio y mejoren la experiencia del evento.

Reglas de cross-sell:
- Si hay lunch boxes → sugiere bebidas frías o postres
- Si hay coffee break → sugiere snacks dulces o ensaladas de fruta
- Si hay desayuno → sugiere jugos o café especial
- Si el total < $800 → sugiere opciones para completar un pedido más completo
- Si el total > $2000 → sugiere upgrade a opciones premium

CATÁLOGO REAL DE PRODUCTOS (usa SOLO estos nombres):
${productCatalog}

Devuelve SOLO JSON válido con este formato exacto (sin markdown, sin backticks):
{"recommendations":[{"productName":"string","reason":"string","urgencyMessage":"string"},{"productName":"string","reason":"string","urgencyMessage":"string"},{"productName":"string","reason":"string","urgencyMessage":"string"}]}

Los productName deben coincidir exactamente con productos reales del catálogo. Si no tienes certeza del nombre exacto, no lo inventes.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Carrito actual: ${cartDescription}\nTotal del carrito: $${cartTotal}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status);
      return new Response(JSON.stringify({ recommendations: FALLBACK_RECS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const text = aiResponse.content?.[0]?.text || "";

    try {
      const parsed = JSON.parse(text);
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return new Response(JSON.stringify({ recommendations: parsed.recommendations.slice(0, 3) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      console.error("Failed to parse AI response:", text);
    }

    return new Response(JSON.stringify({ recommendations: FALLBACK_RECS }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cart-recommendations error:", err);
    return new Response(JSON.stringify({ recommendations: FALLBACK_RECS }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
