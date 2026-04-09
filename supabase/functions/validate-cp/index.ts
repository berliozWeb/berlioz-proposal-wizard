import { getShippingInfo } from "../../src/utils/shippingCalculator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { postalCode } = await req.json();
    if (!postalCode || typeof postalCode !== "string" || postalCode.length !== 5) {
      return new Response(JSON.stringify({ valid: false, error: "CP inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const info = getShippingInfo(postalCode);
    return new Response(JSON.stringify({
      valid: info.isValid,
      zone: info.zone,
      price: info.price,
      hasPickup: info.hasPickup,
      message: info.message ?? null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ valid: false, error: "Error al validar" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
