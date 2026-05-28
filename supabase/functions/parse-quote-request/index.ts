import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `Eres el asistente de cotización de Berlioz Catering Corporativo (CDMX).
Extraes parámetros de un texto libre en español y devuelves SOLO JSON válido, sin markdown.

Reglas:
- eventType: "desayuno" | "comida" | "coffee-break" | "otro"
- peopleCount: integer, mínimo 4, default 10
- budgetPerPerson: número en MXN, solo si se menciona explícitamente
- budgetEnabled: true si menciona presupuesto/precio/costo, false si no
- dietaryCounts: array de { tipo, cantidad }
  tipos válidos: "vegano" | "vegetariano" | "keto" | "sin_gluten" | "sin_lactosa"
- contactName: string | null
- companyName: string | null

Devuelve SOLO este JSON sin texto adicional:
{"eventType":"comida","peopleCount":10,"budgetPerPerson":null,"budgetEnabled":false,"dietaryCounts":[],"contactName":null,"companyName":null}`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: "Texto vacío" }), { status: 400, headers: CORS });
    }
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const ai = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: "user", content: `Extrae los parámetros de: "${text.trim()}"` }],
    });
    const raw = ai.content[0].type === "text" ? ai.content[0].text : "";
    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(clean);
    parsed.peopleCount = Math.max(4, Math.min(500, parsed.peopleCount || 10));
    if (!parsed.dietaryCounts) parsed.dietaryCounts = [];
    return new Response(JSON.stringify(parsed), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    console.error("parse-quote-request error:", msg);
    return new Response(JSON.stringify({ error: "No pude entender la descripción." }), { status: 500, headers: CORS });
  }
});