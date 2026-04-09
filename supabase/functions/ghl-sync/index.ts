import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { contact, quote } = await req.json();
    const GHL_TOKEN = Deno.env.get("GHL_API_KEY");
    if (!GHL_TOKEN) {
      throw new Error("GHL_API_KEY not configured");
    }

    const LOCATION_ID = "dSB6uzigSPSqv5kVKawE";
    const BASE = "https://services.leadconnectorhq.com";
    const headers = {
      Authorization: `Bearer ${GHL_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    };

    // Step 1: Upsert contact
    const contactRes = await fetch(`${BASE}/contacts/upsert`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId: LOCATION_ID,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        companyName: contact.company,
        tags: ["cotizacion-berlioz", quote.eventType],
        customFields: [
          { key: "event_type", field_value: quote.eventType },
          { key: "event_date", field_value: quote.eventDate },
          { key: "people_count", field_value: String(quote.people) },
          { key: "total_estimated", field_value: String(quote.total) },
          { key: "selected_tier", field_value: quote.tier },
          { key: "source", field_value: "cotizador-berlioz" },
        ],
      }),
    });

    const contactData = await contactRes.json();
    const contactId = contactData.contact?.id;

    console.log("GHL contact upsert:", contactRes.status, contactId);

    // Step 2: Create opportunity
    if (contactId) {
      const oppRes = await fetch(`${BASE}/opportunities/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          locationId: LOCATION_ID,
          contactId,
          name: `${contact.company} - ${quote.eventType} - ${quote.eventDate}`,
          status: "open",
          monetaryValue: quote.total,
          source: "cotizador-berlioz",
        }),
      });
      console.log("GHL opportunity:", oppRes.status);
      await oppRes.text(); // consume body
    }

    return new Response(
      JSON.stringify({ success: true, contactId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GHL sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
