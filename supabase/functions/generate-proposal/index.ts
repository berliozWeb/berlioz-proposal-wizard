// ============================================================
// BERLIOZ — Edge Function: generate-proposal (RAG con sales_insights)
// Recibe la solicitud del usuario, recupera insights relevantes
// de Supabase, los inyecta en el prompt de Claude y guarda la
// cotización generada para el feedback loop.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      user_message,
      categoria = "",
      num_personas = 0,
      empresa = "",
      sector = "",
      conversation_history = [],
    } = await req.json();

    if (!user_message || typeof user_message !== "string") {
      return json({ error: "user_message is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Determinar qué insights cargar según la categoría / tamaño
    const keys = buildKeys(categoria, num_personas);

    const { data: insights, error: insightsError } = await supabase
      .from("sales_insights")
      .select("insight_type, context_key, insight_text")
      .or(
        keys.map((k) => `context_key.eq.${k}`).join(",") +
          ",insight_type.eq.growth_trend",
      )
      .limit(8);

    if (insightsError) {
      console.error("Error fetching insights:", insightsError);
    }

    // 2. Construir el prompt con contexto RAG
    const systemPrompt = buildSystemPrompt(
      insights || [],
      categoria,
      num_personas,
      empresa,
      sector,
    );

    // 3. Llamar a Claude
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          ...conversation_history,
          { role: "user", content: user_message },
        ],
      }),
    });

    const claudeData = await anthropicRes.json();
    if (!anthropicRes.ok) {
      console.error("Anthropic API error:", claudeData);
      return json(
        { error: claudeData?.error?.message || "Claude API error" },
        anthropicRes.status,
      );
    }

    const proposal = claudeData.content?.[0]?.text || "";

    // 4. Guardar en quotes para el feedback loop
    const { data: saved, error: insertError } = await supabase
      .from("quotes")
      .insert({
        user_message,
        categoria,
        num_personas,
        empresa,
        sector,
        proposal_text: proposal,
        insights_used: keys,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error saving quote:", insertError);
    }

    return json({
      proposal,
      quote_id: saved?.id ?? null,
      insights_used: keys,
    });
  } catch (err) {
    console.error("generate-proposal error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildKeys(categoria: string, _personas: number): string[] {
  const base = [
    "por_categoria",
    "por_tamano_pedido",
    "clientes_frecuentes",
    "generales",
  ];
  const cat = (categoria || "").toLowerCase();
  if (cat.includes("desayuno")) base.push("desayuno");
  if (cat.includes("working") || cat.includes("lunch")) base.push("working_lunch");
  if (cat.includes("coffee") || cat.includes("break")) base.push("coffee_break");
  if (cat.includes("vegano") || cat.includes("vegetariano")) base.push("vegano");
  if (!categoria || cat === "mixto") {
    base.push("working_lunch", "desayuno", "coffee_break");
  }
  return [...new Set(base)];
}

function buildSystemPrompt(
  insights: { insight_text: string }[],
  categoria: string,
  personas: number,
  empresa: string,
  sector: string,
): string {
  const insightBlock = insights.length
    ? "DATOS REALES DE VENTAS BERLIOZ (úsalos para personalizar la propuesta):\n" +
      insights.map((i) => `• ${i.insight_text}`).join("\n\n")
    : "";

  let sizeHint = "";
  if (personas > 0 && personas <= 10) {
    sizeHint = `Grupo pequeño (${personas} personas). Sugiere porciones estándar.`;
  } else if (personas <= 30) {
    sizeHint = `Grupo mediano (${personas} personas). Considera paquetes combinados.`;
  } else if (personas <= 60) {
    sizeHint = `Grupo grande (${personas} personas). Working Lunch + Bebidas es el combo más popular históricamente.`;
  } else if (personas > 60) {
    sizeHint = `Evento grande (${personas} personas). Prioriza opciones de volumen.`;
  }

  return `Eres ANA, asistente de cotización de Berlioz — catering gourmet corporativo en Ciudad de México.

PRODUCTOS DISPONIBLES:
- Working Lunch: PINK BOX ($390/p), White Box ($330/p), BLACK BOX ($350/p), GOLDEN BOX ($330/p), SALAD BOX POLLO ($320/p), Orzo Pasta Salad Box ($390/p), Lunch Bag Ciabatta pavo, Lunch Bag Pasta pollo
- Desayuno: Breakfast Bag pavo, BREAKFAST IN ROMA Yogurt
- Coffee Break: combos con frutas, crudités, mini sándwiches
- Bebidas: Agua Fresca Limón con Menta, Naranjada, Agua de Jamaica
- Vegano/Vegetariano: disponible en todas las categorías (opción premium, ticket más alto)

CÓMO RESPONDER:
1. Confirma brevemente que entendiste la necesidad
2. Propón 2–3 opciones concretas con productos del catálogo y precio estimado por persona
3. Incluye siempre una bebida como complemento
4. Sugiere horario de entrega según el tipo de servicio
5. Cierra pidiendo confirmar para generar cotización formal
Máximo 280 palabras. Tono cálido, profesional, español mexicano. Sin emojis excesivos.

${empresa ? `Cliente: ${empresa}.` : ""} ${sector ? `Sector: ${sector}.` : ""} ${sizeHint}

${insightBlock}`;
}
