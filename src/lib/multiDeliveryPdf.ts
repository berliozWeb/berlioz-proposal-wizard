// ═══════════════════════════════════════════════════════════
// Multi-día PDF — faithful port of the Berlioz backoffice
// generateMultiDayPDF: portada + 1 page per slot + summary.
// ═══════════════════════════════════════════════════════════

import { jsPDF } from "jspdf";
import { format, parse as parseDate, isValid as isValidDate } from "date-fns";
import { es } from "date-fns/locale";
import {
  QUOTE_FOOTER_NOTES,
  QUOTE_VALIDITY_DAYS,
  generateQuoteId,
  IVA_RATE,
  BASE_SHIPPING_COST,
} from "@/domain/entities/BerliozCatalog";
import type { SlotProposal, ProposedProduct } from "@/domain/entities/SmartQuote";
import { buildProductImageUrl } from "@/lib/imageUtils";
import {
  ensureMontserrat, registerMontserrat, setFont,
  loadImageAsDataURL, getImageFormat,
  drawRosaHeader, drawRosaFooter, applyFooterAllPages,
  drawHeroImage, drawSectionLabel, drawQuoteFolio,
  drawProductRow, drawTotalsBox, drawNotesAndBrand,
  ensureSpace,
  PAGE_W, PAGE_H, MARGIN_X, MARGIN_BOTTOM, CONTENT_W, HEADER_H,
  NAVY, ROSA, ROSA_SOFT, WHITE, TEXT, TEXT_SOFT, MUTED, MUTED_DARK,
  BERLIOZ_LOGO_URL,
} from "@/lib/pdfTemplate";

export interface MultiPdfSlotInput {
  slot: SlotProposal;
  selectedTier: string;
  tierLabel: string;
  total: number;
  subtotal: number;
}

export interface MultiPdfInput {
  clientName: string;
  empresa: string;
  eventLabel: string;
  postalCode: string;
  slots: MultiPdfSlotInput[];
  email?: string;
  eventType?: string;
  /** Optional hero image override. Leave undefined to auto-pick from most expensive product. */
  heroImageUrl?: string;
  /** Optional notes override. */
  notasCondiciones?: string[];
  preparadaPor?: string;
}

const fmtMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);

function fmtDateLong(raw: string): string {
  if (!raw) return "Fecha por confirmar";
  const d = parseDate(raw, "yyyy-MM-dd", new Date());
  if (!isValidDate(d)) return raw;
  const s = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDateShort(raw: string): string {
  if (!raw) return "—";
  const d = parseDate(raw, "yyyy-MM-dd", new Date());
  if (!isValidDate(d)) return raw;
  return format(d, "dd/MM/yyyy");
}

function fmtPeriodLabel(slots: MultiPdfSlotInput[]): string {
  const dates = slots
    .map((s) => parseDate(s.slot.date, "yyyy-MM-dd", new Date()))
    .filter((d) => isValidDate(d))
    .sort((a, b) => a.getTime() - b.getTime());
  if (!dates.length) return "—";
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.getTime() === last.getTime()) {
    return format(first, "d 'de' MMMM 'de' yyyy", { locale: es });
  }
  return `${format(first, "d MMM", { locale: es })} al ${format(last, "d MMM yyyy", { locale: es })}`;
}

function stripHtml(s: string | null | undefined): string {
  return (s || "").replace(/<[^>]+>/g, "").trim();
}

function parseDayIndex(label: string): number {
  const m = label.match(/D[ií]a\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 1;
}
function parseDeliveryIndex(label: string, fallback: number): number {
  const m = label.match(/Entrega\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : fallback;
}

/* ───────────── Pages ───────────── */

function drawSlotPage(
  doc: jsPDF,
  p: {
    input: MultiPdfSlotInput;
    slotIndex: number;
    slotTotal: number;
    logoData: string | null;
    imgs: (string | null)[];
  },
) {
  const { input, slotIndex, slotTotal, logoData, imgs } = p;
  const tier = input.slot.tiers.find((t) => t.tier === input.selectedTier);
  if (!tier) return;

  // Navy header band
  const headerH = 26;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, headerH, "F");
  if (logoData) {
    try { doc.addImage(logoData, "PNG", MARGIN_X, 7, 22, 11, undefined, "FAST"); } catch { /* ignore */ }
  }
  setFont(doc, "bold", 14);
  doc.setTextColor(...WHITE);
  const dayIdx = parseDayIndex(input.slot.label);
  const delIdx = parseDeliveryIndex(input.slot.label, slotIndex);
  doc.text(`Entrega ${delIdx} · Día ${dayIdx}`, PAGE_W / 2, 13, { align: "center" });
  setFont(doc, "regular", 9);
  doc.text(`(${slotIndex} de ${slotTotal})`, PAGE_W / 2, 19, { align: "center" });
  setFont(doc, "regular", 8);
  doc.text(fmtDateLong(input.slot.date), PAGE_W - MARGIN_X, 13, { align: "right" });
  doc.text(`${input.slot.time || "—"} hrs`, PAGE_W - MARGIN_X, 19, { align: "right" });

  let y = 38;

  // Rosa info card — 3 columns
  const cardH = 22;
  doc.setFillColor(...ROSA);
  doc.rect(MARGIN_X, y, CONTENT_W, cardH, "F");
  const col1 = MARGIN_X + 6;
  const col2 = MARGIN_X + CONTENT_W / 3 + 6;
  const col3 = MARGIN_X + (CONTENT_W * 2) / 3 + 6;
  setFont(doc, "bold", 8);
  doc.setTextColor(...NAVY);
  doc.text("FECHA", col1, y + 8);
  doc.text("HORA", col2, y + 8);
  doc.text("PERSONAS", col3, y + 8);
  setFont(doc, "regular", 10);
  doc.setTextColor(...TEXT);
  doc.text(fmtDateLong(input.slot.date), col1, y + 16);
  doc.text(input.slot.time || "—", col2, y + 16);
  doc.text(
    `${input.slot.guests_count} ${input.slot.guests_count === 1 ? "persona" : "personas"}`,
    col3, y + 16,
  );
  y += cardH + 10;

  drawSectionLabel(doc, "Menú de la entrega", y);
  y += 6;

  // Items
  for (const it of tier.items) {
    y = ensureSpace(doc, y, 24);
    const idx = tier.items.indexOf(it);
    y = drawProductRow(doc, y, {
      name: it.productName,
      description: stripHtml(it.descripcion),
      qty: it.quantity,
      unitPrice: it.unitPrice,
      imgData: imgs[idx] || null,
    });
  }

  y += 6;
  y = ensureSpace(doc, y, 40);

  drawTotalsBox(
    doc, y,
    [
      ["Subtotal productos", tier.subtotal],
      ["Envío", tier.shipping],
      [`IVA (${(IVA_RATE * 100).toFixed(0)}%)`, tier.iva],
    ],
    "TOTAL ENTREGA",
    tier.total,
  );
}

function drawSummaryPage(
  doc: jsPDF,
  p: {
    input: MultiPdfInput;
    logoData: string | null;
    quoteId: string;
    validStr: string;
    grandSubtotal: number;
    grandShipping: number;
    grandIva: number;
    grandTotal: number;
  },
) {
  const { input, logoData, quoteId, validStr, grandSubtotal, grandShipping, grandIva, grandTotal } = p;

  drawRosaHeader(doc, logoData);
  let y = 38;

  // Folio
  setFont(doc, "bold", 10);
  doc.setTextColor(...NAVY);
  doc.text(`Cotización ${quoteId}`, PAGE_W - MARGIN_X, y, { align: "right" });
  y += 4;
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
  y += 8;

  // Two-column cliente / evento
  const colW = (CONTENT_W - 8) / 2;
  const lx = MARGIN_X;
  const rx = MARGIN_X + colW + 8;
  setFont(doc, "bold", 8);
  doc.setTextColor(...NAVY);
  doc.text("DATOS DEL CLIENTE", lx, y);
  doc.text("DETALLES DEL EVENTO", rx, y);
  y += 6;

  let yL = y, yR = y;
  const drawKV = (x: number, yk: number, k: string, v: string) => {
    setFont(doc, "bold", 10); doc.setTextColor(...TEXT);
    doc.text(`${k}:`, x, yk);
    setFont(doc, "regular", 10); doc.setTextColor(...TEXT_SOFT);
    doc.text(v || "—", x + 26, yk);
  };
  drawKV(lx, yL, "Atención", `${input.clientName || "—"} — ${input.empresa || "—"}`); yL += 6;
  if (input.email) { drawKV(lx, yL, "Email", input.email); yL += 6; }
  drawKV(lx, yL, "Tipo", input.eventLabel); yL += 6;

  drawKV(rx, yR, "Período", fmtPeriodLabel(input.slots)); yR += 6;
  drawKV(rx, yR, "Entregas", String(input.slots.length)); yR += 6;
  drawKV(rx, yR, "CP base", input.postalCode || "—"); yR += 6;
  drawKV(rx, yR, "Preparada por", input.preparadaPor || "Equipo Ventas"); yR += 6;

  y = Math.max(yL, yR) + 6;

  drawSectionLabel(doc, "Resumen de entregas", y);
  y += 6;

  // Summary table — navy header
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN_X, y, CONTENT_W, 8, "F");
  setFont(doc, "bold", 8);
  doc.setTextColor(...WHITE);
  const cols = {
    entrega: MARGIN_X + 3,
    fecha:   MARGIN_X + 22,
    hora:    MARGIN_X + 78,
    pers:    MARGIN_X + 95,
    sub:     MARGIN_X + 130,
    iva:     MARGIN_X + 153,
    tot:     MARGIN_X + CONTENT_W - 3,
  };
  doc.text("Entrega", cols.entrega, y + 5.5);
  doc.text("Fecha", cols.fecha, y + 5.5);
  doc.text("Hora", cols.hora, y + 5.5, { align: "center" });
  doc.text("Pers.", cols.pers, y + 5.5, { align: "center" });
  doc.text("Subtotal + Envío", cols.sub, y + 5.5, { align: "right" });
  doc.text("IVA", cols.iva, y + 5.5, { align: "right" });
  doc.text("Total", cols.tot, y + 5.5, { align: "right" });
  y += 8;

  let zebraIdx = 0;
  for (const s of input.slots) {
    const tier = s.slot.tiers.find((t) => t.tier === s.selectedTier);
    if (!tier) continue;
    y = ensureSpace(doc, y, 8);
    if (zebraIdx % 2 !== 0) {
      doc.setFillColor(...ROSA_SOFT);
      doc.rect(MARGIN_X, y, CONTENT_W, 8, "F");
    }
    setFont(doc, "bold", 8);
    doc.setTextColor(...TEXT);
    doc.text(
      `D${parseDayIndex(s.slot.label)} · E${parseDeliveryIndex(s.slot.label, zebraIdx + 1)}`,
      cols.entrega, y + 5.5,
    );
    setFont(doc, "regular", 8);
    doc.text(fmtDateLong(s.slot.date), cols.fecha, y + 5.5);
    doc.text(s.slot.time || "—", cols.hora, y + 5.5, { align: "center" });
    doc.text(String(s.slot.guests_count), cols.pers, y + 5.5, { align: "center" });
    doc.text(fmtMXN(tier.subtotal + tier.shipping), cols.sub, y + 5.5, { align: "right" });
    doc.text(fmtMXN(tier.iva), cols.iva, y + 5.5, { align: "right" });
    setFont(doc, "bold", 8);
    doc.text(fmtMXN(tier.total), cols.tot, y + 5.5, { align: "right" });
    y += 8;
    zebraIdx++;
  }

  y += 8;

  // Navy grand total bar
  y = ensureSpace(doc, y, 22);
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN_X, y, CONTENT_W, 18, "F");
  setFont(doc, "bold", 12);
  doc.setTextColor(...WHITE);
  doc.text("TOTAL GENERAL DEL EVENTO", MARGIN_X + 6, y + 11);
  setFont(doc, "bold", 16);
  doc.text(`${fmtMXN(grandTotal)} MXN`, PAGE_W - MARGIN_X - 6, y + 11.5, { align: "right" });
  y += 26;

  // Notes + brand
  const notes = input.notasCondiciones && input.notasCondiciones.length > 0
    ? input.notasCondiciones
    : QUOTE_FOOTER_NOTES;
  drawNotesAndBrand(doc, y, notes, logoData);
}

/* ───────────── Main entry ───────────── */

export async function generateMultiDeliveryPdf(input: MultiPdfInput): Promise<void> {
  await ensureMontserrat();
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  registerMontserrat(doc);

  const quoteId = generateQuoteId();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + QUOTE_VALIDITY_DAYS);
  const validStr = validUntil.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  // ── Load logo ──
  const logoData = await loadImageAsDataURL(BERLIOZ_LOGO_URL);

  // ── Pre-load product images per slot ──
  const slotImgMap = new Map<string, (string | null)[]>();
  for (const s of input.slots) {
    const tier = s.slot.tiers.find((t) => t.tier === s.selectedTier);
    if (!tier) { slotImgMap.set(s.slot.slot_id, []); continue; }
    const imgs = await Promise.all(
      tier.items.map((it) => {
        const url = buildProductImageUrl(it.imageUrl ?? null, null) || "";
        return url ? loadImageAsDataURL(url) : Promise.resolve(null);
      }),
    );
    slotImgMap.set(s.slot.slot_id, imgs);
  }

  // ── Resolve hero (most expensive product if not provided) ──
  let heroUrl = input.heroImageUrl;
  if (!heroUrl) {
    const allItems = input.slots.flatMap((s) => {
      const t = s.slot.tiers.find((tt) => tt.tier === s.selectedTier);
      return t ? t.items.map((it) => ({ price: it.unitPrice, url: buildProductImageUrl(it.imageUrl ?? null, null) })) : [];
    }).filter((x) => !!x.url).sort((a, b) => b.price - a.price);
    heroUrl = allItems[0]?.url || undefined;
  }
  const heroData = heroUrl ? await loadImageAsDataURL(heroUrl) : null;

  // ── PAGE 1 — Portada (rosa header + hero) ──
  drawRosaHeader(doc, logoData);
  drawHeroImage(doc, 38, CONTENT_W / 3, heroData);

  // ── Slot pages ──
  const total = input.slots.length;
  for (let i = 0; i < total; i++) {
    doc.addPage();
    drawSlotPage(doc, {
      input: input.slots[i],
      slotIndex: i + 1,
      slotTotal: total,
      logoData,
      imgs: slotImgMap.get(input.slots[i].slot.slot_id) || [],
    });
  }

  // ── Summary page ──
  const grandSubtotal = input.slots.reduce((s, x) => {
    const t = x.slot.tiers.find((tt) => tt.tier === x.selectedTier);
    return s + (t?.subtotal || 0);
  }, 0);
  const grandShipping = input.slots.reduce((s, x) => {
    const t = x.slot.tiers.find((tt) => tt.tier === x.selectedTier);
    return s + (t?.shipping || BASE_SHIPPING_COST);
  }, 0);
  const grandIva = input.slots.reduce((s, x) => {
    const t = x.slot.tiers.find((tt) => tt.tier === x.selectedTier);
    return s + (t?.iva || 0);
  }, 0);
  const grandTotal = input.slots.reduce((s, x) => s + (x.total || 0), 0);

  doc.addPage();
  drawSummaryPage(doc, {
    input, logoData, quoteId, validStr,
    grandSubtotal, grandShipping, grandIva, grandTotal,
  });

  applyFooterAllPages(doc);

  const safeEmpresa = (input.empresa || input.clientName || "Cliente")
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, "")
    .replace(/\s+/g, "_");
  doc.save(`Berlioz_${safeEmpresa}_${quoteId}_multidia.pdf`);
}