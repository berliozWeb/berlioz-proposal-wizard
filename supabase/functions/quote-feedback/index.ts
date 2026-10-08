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
    const body = await req.json();
    const { proposalId, selectedTier, accepted, productsAdded, productsRemoved, manualChanges, rating, comments } = body;

    if (!proposalId) {
      return new Response(JSON.stringify({ error: "proposalId es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // La propuesta puede no existir (p. ej. propuesta de respaldo o no guardada).
    // En ese caso no se registra feedback y no se considera error.
    const { data: proposal } = await supabase
      .from('quote_proposals')
      .select('id')
      .eq('id', proposalId)
      .maybeSingle();

    if (!proposal) {
      console.warn('Feedback omitido: propuesta inexistente', proposalId);
      return new Response(JSON.stringify({ success: false, skipped: true, reason: "proposal_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from('quote_feedback')
      .insert({
        proposal_id: proposalId,
        selected_tier: selectedTier || null,
        accepted: accepted ?? null,
        products_added: productsAdded || [],
        products_removed: productsRemoved || [],
        manual_changes: manualChanges || {},
        rating: rating || null,
        comments: comments || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Feedback insert error:', error);
      return new Response(JSON.stringify({ error: "Error guardando feedback" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, feedbackId: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Quote feedback error:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
