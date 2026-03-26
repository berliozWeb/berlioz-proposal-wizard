import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATALOG_CONTEXT = `
CATÁLOGO REAL DE BERLIOZ (usa SOLO estos productos y precios):

COFFEE BREAK:
- Coffee Break AM – Café Caliente: $2,800-$4,650 (10-15 pers)
- Coffee Break AM – Café Frío: $1,440-$4,500 (4-15 pers)
- Coffee Break AM – Jugo: $1,440-$4,500 (4-15 pers)
- Coffee Break PM: $1,240-$3,650 (4-15 pers)
- Surtido Camille: $700, Surtido Hugo: $550, Surtido Voltaire: $750
- Surtido Colette: $450, Surtido Zadig: $400, Surtido Balzac: $400
- Surtido de Snacks: $300, Surtido Dulces Mexicanos: $390
- Mini Surtido Hugo: $290, Mini Surtido Colette: $290
- Mini Surtido Voltaire: $350, Mini Surtido Camille: $350
- Mini Surtido Zadig: $240, Mini Surtido Balzac: $220
- Individuales: Panqué $50, Cookies $50, Pan Dulce $50, Paleta $45
- Frescos: Mix Semillas $60, Ensalada Fruta $50, Yogurt $50, Crudités $50

DESAYUNO (desde 7:30am):
- Desayuno Berlioz: $170/persona [#1 más vendido, 4,057 uds]
- Healthy Breakfast: $335 [vegetariano]
- Box Chilaquiles: $310-$330
- Breakfast in Roma: $290 [2,247 uds], Vegetariano: $310-$360
- Breakfast London: $320, Vegetariano: $340
- Breakfast in Montreal: $410 [premium]
- Breakfast BLT: $330
- Breakfast Bag (pavo): $250 [3,169 uds], (vegetariana): $270, (especial): $280

WORKING LUNCH (desde 10am) ⭐ CATEGORÍA MÁS POPULAR:
- Salmon Box: $410 [premium]
- Orzo Pasta Salad Box: $390 [#3, 3,586 uds]
- Pink Box: $370 [#2, 3,728 uds] [veg/vegano/keto/GF opciones]
- Aqua Box: $330, Green Box: $340 [healthy]
- Golden Box: $330 [3,082 uds], Black Box: $330 [2,897 uds]
- BLT Box: $330, Box Oriental: $290 [2,561 uds]
- White Box: $300 [#4, 3,284 uds]
- Salad Box Pollo: $280-$320 [2,624 uds], Tex Mex Salad Box: $300
- Lunch Bag Ciabatta (pavo): $250 [2,830 uds], (vegetariana): $270
- Lunch Bag Pasta (pollo): $250 [2,267 uds], (vegetariana): $270
- Comedor Berlioz: $170 [#1, 4,057 uds], Mini Box: $170
- Box Económica 1-Torta: $150, Box Económica 2: $170, Box Económica 3: $190

VEGANO/VEGETARIANO:
- Pink Box Vegetariana/Vegana: $370, Pink Box Keto-Sin Gluten: $370
- Orzo Vegetariana: $390, Box Oriental Vegetariana: $290
- Salad Box Vegana: $300-$320, Salad Box Vegetariana: $280-$300
- Salad Box Pollo Gluten Free: $300-$320

TORTAS PIROPO (gourmet):
- Tinga/Jamón/Carnitas/Cochinita: $280, Camarón: $320
- Surtida charola: $450-$550

BEBIDAS:
- Café/Té Berlioz (grupal): $540
- Café Frío: $60, Jugo Naranja: $60
- Aguas Bui: $50, San Pellegrino: $50
- Agua Fresca Limón con Menta: $45 [#1 bebida, 3,139 uds]
- Aguas de sabor: $45, Refrescos: $45

ESTADÍSTICAS REALES: Ticket promedio: $6,928 | Mediana: $5,208
Top 5 más vendidos: 1.Comedor Berlioz 2.Pink Box 3.Orzo Pasta 4.White Box 5.Breakfast Bag Pavo
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, peopleCount, date, timeSlot, eventTime, deliveryTime, dietaryRestrictions, budgetPerPerson, hasBudget, postalCode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres el asistente de cotización de Berlioz, empresa de catering corporativo gourmet en Ciudad de México. Llevas más de 10 años sirviendo a empresas como EY, DHL, INVEX, Maersk y MillerKnoll.

Con base en los detalles del evento, genera exactamente 3 propuestas de menú del catálogo real de Berlioz.

REGLAS ESTRICTAS:
- Usa SOLO productos del catálogo real proporcionado abajo
- La Opción 2 (índice 1) DEBE ser la recomendada (mejor balance calidad/precio) — marca is_recommended: true
- Siempre incluye al menos 1 bebida (Agua Fresca de Limón con Menta $45 es la más pedida)
- Respeta las restricciones dietéticas de forma estricta
- Los precios deben coincidir EXACTAMENTE con el catálogo
- Para eventos de día completo (capacitación, filmación) sugiere combo desayuno + coffee break + lunch
- Opción 1 = Esencial (económica), Opción 2 = Equilibrado (recomendada), Opción 3 = Experiencia (premium)
- Tono: cálido, profesional, en español mexicano
- Siempre incluye al menos 1 opción vegetariana-compatible en cada propuesta

GUÍA DE PRESUPUESTO:
- Budget $150-$200: Comedor Berlioz, Box Económica, Lunch Bags
- Mid-range $200-$350: Box Oriental, White Box, Golden Box, Lunch Bags premium
- Premium $350-$500: Pink Box, Orzo Pasta, Salmon Box, Healthy Breakfast
- VIP $500+: multi-course combos

${CATALOG_CONTEXT}

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown, sin backticks.
Formato exacto:
[
  {
    "name": "nombre de la propuesta",
    "tagline": "descripción corta apetitosa",
    "occasion_fit": "por qué es ideal para este evento (1-2 oraciones)",
    "items": [
      {"product": "nombre exacto del catálogo", "qty_per_person": 1, "unit_price": 0, "notes": "opcional"}
    ],
    "price_per_person": 0,
    "total_price": 0,
    "includes_drink": true,
    "dietary_tags": ["vegetarian-option"],
    "is_recommended": false
  }
]`;

    const budgetInfo = hasBudget === false
      ? "No tiene presupuesto definido — recomienda basándote en la ocasión (usa rango medio como default)"
      : `Presupuesto: $${budgetPerPerson} MXN por persona`;

    const userPrompt = `Evento: ${eventType}
Personas: ${peopleCount}
Fecha: ${date}
Horario del evento: ${eventTime || timeSlot}
Hora de entrega estimada: ${deliveryTime || "90 min antes del evento"}
Restricciones dietéticas: ${dietaryRestrictions?.length ? dietaryRestrictions.join(", ") : "Ninguna"}
${budgetInfo}
${postalCode ? `Código postal: ${postalCode}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_menus",
              description: "Return exactly 3 menu options for a catering event",
              parameters: {
                type: "object",
                properties: {
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        tagline: { type: "string" },
                        occasion_fit: { type: "string" },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              product: { type: "string" },
                              qty_per_person: { type: "number" },
                              unit_price: { type: "number" },
                              notes: { type: "string" },
                            },
                            required: ["product", "qty_per_person", "unit_price"],
                          },
                        },
                        price_per_person: { type: "number" },
                        total_price: { type: "number" },
                        includes_drink: { type: "boolean" },
                        dietary_tags: { type: "array", items: { type: "string" } },
                        is_recommended: { type: "boolean" },
                      },
                      required: ["name", "tagline", "occasion_fit", "items", "price_per_person", "total_price", "includes_drink", "dietary_tags", "is_recommended"],
                    },
                  },
                },
                required: ["options"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_menus" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed.options), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = result.choices?.[0]?.message?.content ?? "";
    return new Response(content, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-quote error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
