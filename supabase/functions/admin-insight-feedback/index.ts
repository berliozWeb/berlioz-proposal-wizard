import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 80);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdminData } = await admin.rpc("is_admin", { _user_id: userId });
    if (!isAdminData) {
      return new Response(JSON.stringify({ error: "Not authorized — admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      proposalId, packageTier, rating, comment, category, requestSnapshot,
    } = body;

    if (!category || typeof rating !== "number" || ![1, -1].includes(rating)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanComment = (comment || "").toString().trim().slice(0, 2000);
    const snap = requestSnapshot || {};
    const ctx = `Para evento ${snap.eventType || "?"} de ${snap.peopleCount || "?"} personas`
      + (snap.budgetPerPerson ? ` con presupuesto $${snap.budgetPerPerson}/persona` : "")
      + (snap.dietary ? ` (dieta: ${JSON.stringify(snap.dietary)})` : "")
      + ` — paquete "${packageTier || "n/a"}" calificado ${rating > 0 ? "👍" : "👎"}.`;

    const insightText = cleanComment
      ? `${cleanComment}\n\nContexto: ${ctx}`
      : `Feedback admin sin comentario. ${ctx}`;

    const contextKey = `admin_fb_${slugify(category)}_${slugify(packageTier || "any")}_${(proposalId || "").slice(0, 8) || Date.now()}`;

    // 1. Audit row
    await admin.from("proposal_admin_feedback").insert({
      proposal_id: proposalId ? String(proposalId) : null,
      package_tier: packageTier || null,
      rating,
      comment: cleanComment || null,
      category,
      request_snapshot: snap,
      created_by: userId,
    });

    // 2. Persist as a learnable insight
    const { error: insErr } = await admin.from("sales_insights").upsert({
      insight_type: category,
      context_key: contextKey,
      insight_text: insightText,
      metadata: {
        source: "admin_feedback",
        rating,
        proposal_id: proposalId || null,
        package_tier: packageTier || null,
        snapshot: snap,
        priority: rating < 0 ? "alta" : "media",
        created_by: userId,
      },
    }, { onConflict: "insight_type,context_key" });

    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, contextKey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-insight-feedback error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});