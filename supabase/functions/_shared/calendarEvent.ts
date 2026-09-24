// Crea / borra el evento de Google Calendar de un pedido de WooCommerce.
// Server-only.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";
export const CALENDAR_ID = "hola@berlioz.mx";
const TZ = "America/Mexico_City";
const STORE_URL = "https://berlioz.mx";

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const meta = (o: any, key: string): string =>
  String((o.meta_data ?? []).find((m: any) => m.key === key)?.value ?? "").trim();

const pad = (n: number) => String(n).padStart(2, "0");

/** Devuelve "YYYY-MM-DD" desde ISO o "26 Septiembre, 2026". */
function parseFecha(raw: string): string | null {
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const es = raw.toLowerCase().match(/(\d{1,2})\s+([a-záéíóú]+),?\s+(\d{4})/);
  if (es && MESES[es[2]]) return `${es[3]}-${pad(MESES[es[2]])}-${pad(Number(es[1]))}`;
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;
  return null;
}

/** "13:00" → [13:00, 14:00]; "11:00 - 12:30" → [11:00, 12:30]. */
function parseHorario(raw: string): [string, string] | null {
  const horas = [...raw.matchAll(/(\d{1,2}):(\d{2})/g)].map((m) => [Number(m[1]), Number(m[2])]);
  if (!horas.length) return null;
  const [h, m] = horas[0];
  const fin = horas[1] ?? [Math.min(h + 1, 23), m];
  return [`${pad(h)}:${pad(m)}:00`, `${pad(fin[0])}:${pad(fin[1])}:00`];
}

export function debeCrearEvento(order: any): boolean {
  if (Deno.env.get("CALENDAR_ALL_ORDERS") === "true") return true;
  return meta(order, "_berlioz_origen") === "web-nueva";
}

export function construirEvento(order: any) {
  const fecha = parseFecha(meta(order, "_berlioz_fecha_entrega") || meta(order, "Fecha de Entrega"));
  const horario = parseHorario(meta(order, "_berlioz_horario_entrega") || meta(order, "Horario de Entrega"));
  if (!fecha) throw new Error("El pedido no tiene fecha de entrega legible");
  const [ini, fin] = horario ?? ["09:00:00", "10:00:00"];

  const items = (order.line_items ?? []).map((i: any) => `x ${i.quantity} ${i.name}`);
  const pickup = meta(order, "_berlioz_tipo_entrega") === "pickup";
  const s = order.shipping?.address_1 ? order.shipping : order.billing ?? {};
  const direccion = pickup
    ? "Recoger en Lago Onega 265, Modelo Pensil"
    : [s.address_1, s.address_2, s.city, s.postcode].filter(Boolean).join(", ");

  const b = order.billing ?? {};
  const notas = meta(order, "_berlioz_notas") || order.customer_note || "";
  const horaEvento = meta(order, "_berlioz_hora_evento");

  const description = [
    `Pedido #${order.number ?? order.id}`,
    `Cliente: ${[b.first_name, b.last_name].filter(Boolean).join(" ")}${b.phone ? ` · Tel: ${b.phone}` : ""}`,
    b.company ? `Empresa: ${b.company}` : "",
    "",
    "Productos:",
    ...items.map((l: string) => `• ${l}`),
    "",
    horaEvento ? `Hora del evento: ${horaEvento}` : "",
    notas ? `Notas: ${notas}` : "",
    `Total: $${order.total ?? ""} MXN`,
    `${STORE_URL}/wp-admin/post.php?post=${order.id}&action=edit`,
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");

  return {
    summary: `(${order.number ?? order.id}) ${items.join(", ")}`.slice(0, 250),
    location: direccion,
    description,
    start: { dateTime: `${fecha}T${ini}`, timeZone: TZ },
    end: { dateTime: `${fecha}T${fin}`, timeZone: TZ },
  };
}

async function gcal(path: string, init: RequestInit) {
  const lk = Deno.env.get("LOVABLE_API_KEY");
  const ck = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
  if (!lk || !ck) throw new Error("Google Calendar no está conectado");
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lk}`,
      "X-Connection-Api-Key": ck,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok && !(init.method === "DELETE" && (res.status === 404 || res.status === 410))) {
    throw new Error(`Google Calendar [${res.status}]: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

/** Sincroniza el calendario con el estado del pedido. Nunca lanza. */
export async function syncOrderCalendar(supabase: any, order: any) {
  const wooId = Number(order?.id);
  if (!wooId) return { skipped: "sin id" };
  const status = String(order.status ?? "");
  const cal = encodeURIComponent(CALENDAR_ID);

  const { data: row } = await supabase
    .from("order_calendar_events").select("*").eq("woo_order_id", wooId).maybeSingle();

  try {
    if (status === "processing") {
      if (!debeCrearEvento(order)) return { skipped: "origen" };
      if (row?.google_event_id && row.status === "created") return { skipped: "ya existe" };
      const ev = await gcal(`/calendars/${cal}/events`, {
        method: "POST",
        body: JSON.stringify(construirEvento(order)),
      });
      await supabase.from("order_calendar_events").upsert(
        { woo_order_id: wooId, google_event_id: ev.id, calendar_id: CALENDAR_ID, status: "created", last_error: null },
        { onConflict: "woo_order_id" },
      );
      return { created: ev.id };
    }

    if (["cancelled", "refunded", "failed"].includes(status) && row?.google_event_id && row.status === "created") {
      await gcal(`/calendars/${cal}/events/${encodeURIComponent(row.google_event_id)}`, { method: "DELETE" });
      await supabase.from("order_calendar_events")
        .update({ status: "deleted", last_error: null }).eq("woo_order_id", wooId);
      return { deleted: row.google_event_id };
    }
    return { skipped: `status ${status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`calendar sync pedido ${wooId}:`, msg);
    await supabase.from("order_calendar_events").upsert(
      { woo_order_id: wooId, google_event_id: row?.google_event_id ?? null, calendar_id: CALENDAR_ID, status: row?.status === "created" ? "created" : "error", last_error: msg },
      { onConflict: "woo_order_id" },
    );
    return { error: msg };
  }
}
