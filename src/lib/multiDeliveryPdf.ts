// ═══════════════════════════════════════════════════════════
// Multi-delivery PDF — matches the official Berlioz template:
// • Page 1: cream banner + hero + cliente/evento cards + ENTREGAS grid
// • Continuation pages: compact header + remaining entregas
// • Final summary: subtotal + envío + IVA + TOTAL block, NOTAS box
// • Bottom cream band on every page
// ═══════════════════════════════════════════════════════════

import { jsPDF } from "jspdf";
import { format, parse as parseDate, isValid as isValidDate } from "date-fns";
import { es } from "date-fns/locale";
import { formatMXN } from "@/domain/value-objects/Money";
import { buildProductImageUrl } from "@/lib/imageUtils";
import {
  QUOTE_FOOTER_NOTES,
  QUOTE_VALIDITY_DAYS,
  generateQuoteId,
} from "@/domain/entities/BerliozCatalog";
import type { SlotProposal, ProposalPackage, ProposedProduct } from "@/domain/entities/SmartQuote";
import {
  drawTopBanner,
  drawHero,
  drawQuoteIdBar,
  drawInfoColumns,
  drawSectionLabel,
  drawCompactHeader,
  drawBottomBand,
  drawNotesBox,
  heroAssetForEvent,
  loadImageBase64,
  MARGIN,
  HEADER_H,
  HERO_H,
  TEAL,
  CREAM_SOFT,
  CREAM_LINE,
  TEXT_DARK,
  TEXT_MUTED,
  HAIRLINE,
} from "@/lib/pdfTemplate";

const TIER_LABELS: Record<string, string> = {
  esencial: "Esencial",
  equilibrado: "Equilibrado",
  experiencia: "Experiencia Completa",
};

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
  /** Optional contact email for the cliente card. */
  email?: string;
  /** Optional event type slug — used to pick the hero image. */
  eventType?: string;
}

// Layout for the slot cards
const CARD_GAP = 6;
const SAFE_BOTTOM = 260; // leave room for footer band

/* ── Formatting helpers ───────────────────────────────────────── */

function fmtDateLabel(raw: string): string {
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

/* ── Card drawing ─────────────────────────────────────────────── */

interface SlotCardCtx {
  doc: jsPDF;
  x: number;
  y: number;
  w: number;
  slotNumber: number;
  input: MultiPdfSlotInput;
  loadedImages: (string | null)[];
}

/** Compute the rendered height of a slot card so we can grid-pack pages. */
function measureSlotCard(
  doc: jsPDF,
  w: number,
  input: MultiPdfSlotInput,
): number {
  const tier = input.slot.tiers.find((t) => t.tier === input.selectedTier);
  const items: ProposedProduct[] = tier ? tier.items : [];
  const innerW = w - 12; // inner padding 6 on each side
  const imgSize = 14;
  const textW = innerW - imgSize - 4 - 30; // 30 reserved for right-side qty/price

  let h = 26; // header (date + hour)
  for (const it of items) {
    const desc = stripHtml(it.descripcion);
    doc.setFontSize(8);
    const descLines = desc ? doc.splitTextToSize(desc, textW) : [];
    const itemH = Math.max(imgSize + 4, 8 + descLines.length * 3.4);
    h += itemH + 2;
  }
  h += 22; // totals block
  return h;
}

function drawSlotCard(ctx: SlotCardCtx): void {
  const { doc, x, y, w, slotNumber, input, loadedImages } = ctx;
  const tier = input.slot.tiers.find((t) => t.tier === input.selectedTier);
  if (!tier) return;
  const items: ProposedProduct[] = tier.items;
  const cardH = measureSlotCard(doc, w, input);

  // Card background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...CREAM_LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, cardH, 2.5, 2.5, "FD");

  // Header (centered date + Entrega N, then hh:mm hrs)
  const dateLbl = fmtDateLabel(input.slot.date);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEAL);
  doc.text(`${dateLbl} · Entrega ${slotNumber}`, x + w / 2, y + 8, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.text(`${input.slot.time || "—"} hrs`, x + w / 2, y + 14, { align: "center" });

  // Divider
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.2);
  doc.line(x + 6, y + 19, x + w - 6, y + 19);

  // Items
  const imgSize = 14;
  const innerW = w - 12;
  const textX = x + 6 + imgSize + 4;
  const textW = innerW - imgSize - 4 - 30;
  let cy = y + 24;

  items.forEach((it, idx) => {
    const desc = stripHtml(it.descripcion);
    const descLines = desc ? doc.splitTextToSize(desc, textW) : [];
    const itemH = Math.max(imgSize + 4, 8 + descLines.length * 3.4);

    // Image
    const imgData = loadedImages[idx];
    if (imgData) {
      try {
        doc.addImage(imgData, "JPEG", x + 6, cy, imgSize, imgSize);
      } catch {
        doc.setFillColor(...CREAM_SOFT);
        doc.roundedRect(x + 6, cy, imgSize, imgSize, 1, 1, "F");
      }
    } else {
      doc.setFillColor(...CREAM_SOFT);
      doc.roundedRect(x + 6, cy, imgSize, imgSize, 1, 1, "F");
    }

    // Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);
    doc.text(it.productName, textX, cy + 4);

    // Description
    if (descLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(descLines.slice(0, 5), textX, cy + 8);
    }

    // Right side: qty × price
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.text(`${it.quantity} × ${formatMXN(it.unitPrice)}`, x + w - 6, cy + 6, { align: "right" });

    cy += itemH + 2;
  });

  // Totals block
  cy = y + cardH - 18;
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.2);
  doc.line(x + 6, cy, x + w - 6, cy);
  cy += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Subtotal productos", x + 6, cy);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatMXN(tier.subtotal), x + w - 6, cy, { align: "right" });
  cy += 4.5;
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Envío", x + 6, cy);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatMXN(tier.shipping), x + w - 6, cy, { align: "right" });
  cy += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("TOTAL C/IVA", x + 6, cy);
  doc.setTextColor(...TEAL);
  doc.text(formatMXN(tier.total), x + w - 6, cy, { align: "right" });
}

/* ── Grid packing across pages ────────────────────────────────── */

async function preloadSlotImages(input: MultiPdfInput): Promise<Map<string, (string | null)[]>> {
  const map = new Map<string, (string | null)[]>();
  for (const s of input.slots) {
    const tier = s.slot.tiers.find((t) => t.tier === s.selectedTier);
    if (!tier) continue;
    const imgs = await Promise.all(
      tier.items.map((it) =>
        loadImageBase64(buildProductImageUrl(it.imageUrl ?? null, null) || ""),
      ),
    );
    map.set(s.slot.slot_id, imgs);
  }
  return map;
}

/* ── Main entry ───────────────────────────────────────────────── */

export async function generateMultiDeliveryPdf(input: MultiPdfInput): Promise<void> {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - MARGIN * 2;
  const colW = (contentW - CARD_GAP) / 2;
  const quoteId = generateQuoteId();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + QUOTE_VALIDITY_DAYS);

  const loadedImages = await preloadSlotImages(input);

  // ═══ PAGE 1 ═══
  drawTopBanner(doc);
  await drawHero(doc, heroAssetForEvent(input.eventType || input.eventLabel));

  let y = HEADER_H + HERO_H + 10;
  drawQuoteIdBar(doc, y, quoteId);
  y += 12;

  // Cliente / Evento (boxed)
  y = drawInfoColumns(
    doc,
    y,
    {
      title: "Datos del cliente",
      lines: [
        ["Atención", input.clientName || "—"],
        ["Empresa", input.empresa || "—"],
        ...(input.email ? ([["Email", input.email]] as Array<[string, string]>) : []),
        ["Tipo", input.eventLabel],
      ],
    },
    {
      title: "Detalles del evento",
      lines: [
        ["Período", fmtPeriodLabel(input.slots)],
        ["Entregas", String(input.slots.length)],
        ["CP base", input.postalCode || "—"],
        ["Preparada por", "Equipo Ventas"],
      ],
    },
    { boxed: true },
  );

  y += 8;
  drawSectionLabel(doc, "Entregas", y);
  y += 6;

  // ═══ Slot cards grid ═══
  let col = 0;
  let rowY = y;
  let rowMax = 0;

  for (let i = 0; i < input.slots.length; i++) {
    const slot = input.slots[i];
    const cardH = measureSlotCard(doc, colW, slot);
    const imgs = loadedImages.get(slot.slot.slot_id) || [];

    // Page break if doesn't fit
    if (rowY + cardH > SAFE_BOTTOM) {
      doc.addPage();
      drawCompactHeader(doc, `Cotización ${quoteId}${input.empresa ? "  ·  " + input.empresa : ""}`);
      rowY = 30;
      drawSectionLabel(doc, "Entregas (continuación)", rowY);
      rowY += 6;
      col = 0;
      rowMax = 0;
    }

    const cx = MARGIN + col * (colW + CARD_GAP);
    drawSlotCard({
      doc,
      x: cx,
      y: rowY,
      w: colW,
      slotNumber: i + 1,
      input: slot,
      loadedImages: imgs,
    });

    rowMax = Math.max(rowMax, cardH);
    col += 1;
    if (col >= 2) {
      rowY += rowMax + CARD_GAP;
      col = 0;
      rowMax = 0;
    }
  }
  // If last row was half-filled, advance Y
  if (col === 1) {
    rowY += rowMax + CARD_GAP;
  }

  // ═══ Grand totals + Notes ═══
  const grandSubtotalProducts = input.slots.reduce((s, x) => {
    const t = x.slot.tiers.find((tt) => tt.tier === x.selectedTier);
    return s + (t?.subtotal || 0);
  }, 0);
  const grandShipping = input.slots.reduce((s, x) => {
    const t = x.slot.tiers.find((tt) => tt.tier === x.selectedTier);
    return s + (t?.shipping || 0);
  }, 0);
  const grandIva = input.slots.reduce((s, x) => {
    const t = x.slot.tiers.find((tt) => tt.tier === x.selectedTier);
    return s + (t?.iva || 0);
  }, 0);
  const grandTotal = input.slots.reduce((s, x) => s + x.total, 0);

  // Need ~ 80mm of room for totals + notes
  if (rowY + 90 > SAFE_BOTTOM + 5) {
    doc.addPage();
    drawCompactHeader(doc, `Cotización ${quoteId}${input.empresa ? "  ·  " + input.empresa : ""}`);
    rowY = 32;
  }

  // Totals (right-aligned)
  const totalsW = 100;
  const totalsX = pageW - MARGIN - totalsW;
  let ty = rowY + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  const rowGap = 6;

  doc.text("Subtotal productos", totalsX, ty);
  doc.setFont("helvetica", "bold");
  doc.text(formatMXN(grandSubtotalProducts), pageW - MARGIN, ty, { align: "right" });
  ty += rowGap;
  doc.setFont("helvetica", "normal");
  doc.text(`Envío (${input.slots.length} entregas)`, totalsX, ty);
  doc.setFont("helvetica", "bold");
  doc.text(formatMXN(grandShipping), pageW - MARGIN, ty, { align: "right" });
  ty += rowGap;

  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.2);
  doc.line(totalsX, ty - 2, pageW - MARGIN, ty - 2);

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", totalsX, ty + 2);
  doc.setFont("helvetica", "bold");
  doc.text(formatMXN(grandSubtotalProducts + grandShipping), pageW - MARGIN, ty + 2, { align: "right" });
  ty += rowGap + 2;
  doc.setFont("helvetica", "normal");
  doc.text("IVA (16%)", totalsX, ty);
  doc.setFont("helvetica", "bold");
  doc.text(formatMXN(grandIva), pageW - MARGIN, ty, { align: "right" });
  ty += rowGap + 2;

  // TOTAL bar
  doc.setFillColor(...TEAL);
  doc.rect(totalsX - 4, ty - 5, totalsW + 4, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", totalsX, ty + 3);
  doc.setFontSize(13);
  doc.text(`${formatMXN(grandTotal)} MXN`, pageW - MARGIN, ty + 3, { align: "right" });

  // Notes box (full width, below totals)
  const notesY = ty + 16;
  drawNotesBox(doc, notesY, QUOTE_FOOTER_NOTES.slice(0, 10));

  // ═══ Bottom band on every page ═══
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawBottomBand(doc);
  }

  doc.save(`Berlioz-Multi-Entrega-${format(new Date(), "yyyyMMdd")}.pdf`);
}