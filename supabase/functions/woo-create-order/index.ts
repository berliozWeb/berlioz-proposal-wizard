import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/woocommerce";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const WOOCOMMERCE_API_KEY = Deno.env.get("WOOCOMMERCE_API_KEY");
const STORE_URL = "https://berlioz.mx";

const ItemSchema = z.object({
  producto_id: z.string().min(1).max(64).optional(),
  woo_product_id: z.number().int().positive().optional(),
  woo_variation_id: z.number().int().positive().optional(),
  name: z.string().min(1).max(300),
  quantity: z.number().int().min(1).max(999),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1).max(60),
  customer: z.object({
    email: z.string().email(),
    first_name: z.string().min(1).max(100),
    last_name: z.string().max(100).optional().default(""),
    phone: z.string().min(8).max(20),
    company: z.string().max(150).optional().default(""),
  }),
  shipping: z.object({
    type: z.enum(["delivery", "pickup"]),
    address_1: z.string().max(200).optional().default(""),
    address_2: z.string().max(200).optional().default(""),
    colonia: z.string().max(150).optional().default(""),
    city: z.string().max(120).optional().default("Ciudad de México"),
    postcode: z.string().max(10).optional().default(""),
  }),
  delivery: z.object({
    date: z.string().min(4).max(20),
    slot: z.string().min(1).max(20),
    event_time: z.string().max(20).optional().default(""),
  }),
  notes: z.string().max(600).optional().default(""),
});

async function woo(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": WOOCOMMERCE_API_KEY!,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`WooCommerce ${path} failed [${res.status}]: ${text}`);
    throw new Error(`[${res.status}]: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (!LOVABLE_API_KEY || !WOOCOMMERCE_API_KEY) {
      return json({ error: "La conexión con la tienda no está configurada." }, 500);
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Datos del pedido inválidos", details: parsed.error.flatten() }, 400);
    }
    const { items, customer, shipping, delivery, notes } = parsed.data;

    // Regla absoluta: Woo manda. Solo pasan renglones que existen publicados y
    // activos en el espejo de la tienda.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: productos, error: dbError } = await supabase
      .from("productos")
      .select("id, nombre, woo_id, woo_variaciones")
      .eq("activo", true)
      .eq("woo_source", true);
    if (dbError) throw new Error(`No se pudo validar el catálogo: ${dbError.message}`);

    const byId = new Map<string, any>();
    const byWooId = new Map<number, any>();
    const variationOwner = new Map<number, any>();
    for (const p of productos ?? []) {
      byId.set(String(p.id), p);
      if (p.woo_id) byWooId.set(Number(p.woo_id), p);
      const vars = Array.isArray(p.woo_variaciones) ? p.woo_variaciones : [];
      for (const v of vars as any[]) {
        const vid = Number(v?.woo_id ?? v?.id);
        if (vid) variationOwner.set(vid, p);
      }
    }

    const lineItems: { product_id: number; variation_id?: number; quantity: number }[] = [];
    const rechazados: string[] = [];

    for (const item of items) {
      let producto: any = null;
      let variationId: number | undefined = item.woo_variation_id;

      if (item.woo_product_id) producto = byWooId.get(item.woo_product_id) ?? null;
      if (!producto && variationId) {
        producto = variationOwner.get(variationId) ?? null;
      }
      if (!producto && item.producto_id) producto = byId.get(item.producto_id) ?? null;
      if (!producto && item.producto_id && /^\d+$/.test(item.producto_id)) {
        const numeric = Number(item.producto_id);
        producto = byWooId.get(numeric) ?? variationOwner.get(numeric) ?? null;
        if (producto && variationOwner.has(numeric)) variationId = numeric;
      }

      if (!producto?.woo_id) {
        rechazados.push(item.name);
        continue;
      }
      if (variationId && !variationOwner.has(variationId)) variationId = undefined;

      lineItems.push({
        product_id: Number(producto.woo_id),
        ...(variationId ? { variation_id: variationId } : {}),
        quantity: item.quantity,
      });
    }

    if (lineItems.length === 0) {
      return json(
        {
          error: "Ninguno de los productos del carrito está disponible en la tienda.",
          rechazados,
        },
        409,
      );
    }

    // Cliente existente en la tienda (si comparte correo)
    let customerId = 0;
    try {
      const found = await woo(`/customers?email=${encodeURIComponent(customer.email)}&per_page=1`);
      if (Array.isArray(found) && found[0]?.id) customerId = Number(found[0].id);
    } catch (_e) {
      // Si la búsqueda falla, el pedido se crea como invitado.
    }

    const addressText =
      shipping.type === "pickup"
        ? "Recoger en Lago Onega 265, Modelo Pensil"
        : [shipping.address_1, shipping.address_2, shipping.colonia, shipping.city, shipping.postcode]
            .filter(Boolean)
            .join(", ");

    const billing = {
      first_name: customer.first_name,
      last_name: customer.last_name ?? "",
      company: customer.company ?? "",
      email: customer.email,
      phone: customer.phone,
      address_1: shipping.type === "pickup" ? "" : shipping.address_1 ?? "",
      address_2: shipping.type === "pickup" ? "" : [shipping.address_2, shipping.colonia].filter(Boolean).join(" "),
      city: shipping.city ?? "",
      postcode: shipping.type === "pickup" ? "" : shipping.postcode ?? "",
      country: "MX",
    };

    const notaCliente = [
      `Entrega: ${delivery.date} · ${delivery.slot}`,
      delivery.event_time ? `Hora del evento: ${delivery.event_time}` : "",
      shipping.type === "pickup" ? "Recolección en sucursal" : `Dirección: ${addressText}`,
      notes ? `Notas: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const order = await woo("/orders", {
      method: "POST",
      body: JSON.stringify({
        status: "pending",
        set_paid: false,
        currency: "MXN",
        customer_id: customerId,
        billing,
        shipping: {
          first_name: customer.first_name,
          last_name: customer.last_name ?? "",
          company: customer.company ?? "",
          address_1: billing.address_1,
          address_2: billing.address_2,
          city: billing.city,
          postcode: billing.postcode,
          country: "MX",
        },
        line_items: lineItems,
        customer_note: notaCliente,
        meta_data: [
          { key: "_berlioz_origen", value: "web-nueva" },
          { key: "_berlioz_fecha_entrega", value: delivery.date },
          { key: "_berlioz_horario_entrega", value: delivery.slot },
          { key: "_berlioz_hora_evento", value: delivery.event_time ?? "" },
          { key: "_berlioz_tipo_entrega", value: shipping.type },
          { key: "_berlioz_notas", value: notes ?? "" },
        ],
      }),
    });

    if (!order?.id || !order?.order_key) {
      throw new Error("La tienda no devolvió el pedido creado.");
    }

    const payUrl = `${STORE_URL}/checkout/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;

    return json({
      order_id: order.id,
      order_number: order.number ?? String(order.id),
      pay_url: payUrl,
      total_estimado: order.total ?? null,
      rechazados,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("woo-create-order error:", message);
    return json({ error: "No se pudo crear el pedido en la tienda", details: message }, 502);
  }
});
