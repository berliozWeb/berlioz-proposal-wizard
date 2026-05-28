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
  ensureMontserrat,
  registerMontserrat,
  setFont,
  drawHeaderLogo,
  drawHeroFull,
  drawQuoteId,
  drawTwoColFields,
  drawLabel,
  drawNotesBlock,
  applyFooterAllPages,
  heroAssetForEvent,
  loadImageBase64,
  PAGE_W,
  PAGE_H,
  MARGIN_X,
  MARGIN_Y,
  NAVY,
  ROSE_PALE,
  BORDER_TAN,
  ROW_RULE,
  RULE_SOFT,
  TEXT_MAIN,
  TEXT_SUB,
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

// Layout for the slot cards (pt units)
const CARD_GAP = 16;
const SAFE_BOTTOM = PAGE_H - MARGIN_Y - 60; // leave room for footer band

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
  const pad = 16;
  const imgSize = 40;
  const textW = w - pad * 2 - imgSize - 10 - 80; // qty/price reserved 80

  let h = pad + 32; // header (date + hour)
  for (const it of items) {
    const desc = stripHtml(it.descripcion);
    setFont(doc, "regular", 9);
    const descLines = desc ? doc.splitTextToSize(desc, textW) : [];
    const itemH = Math.max(imgSize + 8, 18 + descLines.length * 11);
    h += itemH;
  }
  h += 58; // totals block
  return h;
}

function drawSlotCard(ctx: SlotCardCtx): void {
  const { doc, x, y, w, slotNumber, input, loadedImages } = ctx;
  const tier = input.slot.tiers.find((t) => t.tier === input.selectedTier);
  if (!tier) return;
  const items: ProposedProduct[] = tier.items;
  const cardH = measureSlotCard(doc, w, input);

  const pad = 16;
  // Card background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER_TAN);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, w, cardH, 8, 8, "FD");

  // Header
  const dateLbl = fmtDateLabel(input.slot.date);
  setFont(doc, "bold", 13);
  doc.setTextColor(...NAVY);
  doc.text(`${dateLbl} · Entrega ${slotNumber}`, x + w / 2, y + pad + 8, { align: "center" });
  setFont(doc, "regular", 10);
  doc.setTextColor(...TEXT_SUB);
  doc.text(`${input.slot.time || "—"} hrs`, x + w / 2, y + pad + 22, { align: "center" });

  // Divider
  doc.setDrawColor(...RULE_SOFT);
  doc.setLineWidth(0.6);
  doc.line(x + pad, y + pad + 32, x + w - pad, y + pad + 32);

  // Items
  const imgSize = 40;
  const textX = x + pad + imgSize + 10;
  const textW = w - pad * 2 - imgSize - 10 - 80;
  let cy = y + pad + 42;

  items.forEach((it, idx) => {
    const desc = stripHtml(it.descripcion);
    setFont(doc, "regular", 9);
    const descLines = desc ? doc.splitTextToSize(desc, textW) : [];
    const itemH = Math.max(imgSize + 8, 18 + descLines.length * 11);

    const imgData = loadedImages[idx];
    if (imgData) {
      try { doc.addImage(imgData, "JPEG", x + pad, cy, imgSize, imgSize); }
      catch {
        doc.setFillColor(...ROSE_PALE);
        doc.roundedRect(x + pad, cy, imgSize, imgSize, 4, 4, "F");
      }
    } else {
      doc.setFillColor(...ROSE_PALE);
      doc.roundedRect(x + pad, cy, imgSize, imgSize, 4, 4, "F");
    }

    setFont(doc, "bold", 11);
    doc.setTextColor(...TEXT_MAIN);
    doc.text(it.productName, textX, cy + 12);

    if (descLines.length) {
      setFont(doc, "regular", 9);
      doc.setTextColor(...TEXT_SUB);
      doc.text(descLines.slice(0, 4), textX, cy + 24);
    }

    setFont(doc, "semibold", 10);
    doc.setTextColor(...NAVY);
    doc.text(`${it.quantity} × ${formatMXN(it.unitPrice)}`, x + w - pad, cy + 14, { align: "right" });

    cy += itemH;
  });

  // Totals block
  cy = y + cardH - 50;
  doc.setDrawColor(...RULE_SOFT);
  doc.setLineWidth(0.6);
  doc.line(x + pad, cy, x + w - pad, cy);
  cy += 14;

  setFont(doc, "regular", 10);
  doc.setTextColor(...TEXT_SUB);
  doc.text("Subtotal productos", x + pad, cy);
  setFont(doc, "semibold", 10);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(formatMXN(tier.subtotal), x + w - pad, cy, { align: "right" });
  cy += 14;
  setFont(doc, "regular", 10);
  doc.setTextColor(...TEXT_SUB);
  doc.text("Envío", x + pad, cy);
  setFont(doc, "semibold", 10);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(formatMXN(tier.shipping), x + w - pad, cy, { align: "right" });
  cy += 18;
  setFont(doc, "bold", 11);
  doc.setTextColor(...NAVY);
  doc.text("TOTAL C/IVA", x + pad, cy);
  setFont(doc, "bold", 13);
  doc.text(formatMXN(tier.total), x + w - pad, cy, { align: "right" });
}

/* ── Grid packing across pages ────────────────────────────────── */

async function preloadSlotImages(input: MultiPdfInput): Promise<Map<string, (string | null)[]>> {
  const map = new Map<string, (string | null)[]>();
  for (const s of input.slots) {
    const tier = s.slot.tiers.find((t) => t.tier === s.selectedTier);
    if (!tier) continue;
    const imgs = await Promise.all(
      tier.items.map((it) =>
        loadImageBase64(buildProductImageUrl(it.imageUrl ?? null, null) || "", { w: 200, h: 200 }),
      ),
    );
    map.set(s.slot.slot_id, imgs);
  }
  return map;
}

/* ── Main entry ───────────────────────────────────────────────── */

export async function generateMultiDeliveryPdf(input: MultiPdfInput): Promise<void> {
  await ensureMontserrat();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  registerMontserrat(doc);
  const contentW = PAGE_W - MARGIN_X * 2;
  const colW = (contentW - CARD_GAP) / 2;
  const quoteId = generateQuoteId();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + QUOTE_VALIDITY_DAYS);

  const loadedImages = await preloadSlotImages(input);

  // ═══ PAGE 1 ═══
  let y = drawHeaderLogo(doc);
  y = await drawHeroFull(doc, y, heroAssetForEvent(input.eventType || input.eventLabel));
  y = drawQuoteId(doc, y + 4, quoteId);

  y = drawTwoColFields(doc, y + 8,
    {
      title: "Datos del cliente",
      fields: [
        ["Atención", input.clientName || "—"],
        ["Empresa", input.empresa || "—"],
        ...(input.email ? ([["Email", input.email]] as Array<[string, string]>) : []),
        ["Tipo", input.eventLabel],
      ],
    },
    {
      title: "Detalles del evento",
      fields: [
        ["Período", fmtPeriodLabel(input.slots)],
        ["Entregas", String(input.slots.length)],
        ["CP base", input.postalCode || "—"],
        ["Preparada por", "Equipo Ventas"],
      ],
    });

  y += 16;
  drawLabel(doc, "Entregas", MARGIN_X, y);
  y += 14;

  // ═══ Slot cards grid ═══
  let col = 0;
  let rowY = y;
  let rowMax = 0;

  const newContinuationPage = () => {
    doc.addPage();
    setFont(doc, "bold", 14);
    doc.setTextColor(...NAVY);
    doc.setCharSpace(3);
    doc.text("BERLIOZ", PAGE_W / 2, MARGIN_Y + 20, { align: "center" });
    doc.setCharSpace(0);
    let ny = MARGIN_Y + 40;
    drawLabel(doc, "Entregas (continuación)", MARGIN_X, ny);
    return ny + 14;
  };

  for (let i = 0; i < input.slots.length; i++) {
    const slot = input.slots[i];
    const cardH = measureSlotCard(doc, colW, slot);
    const imgs = loadedImages.get(slot.slot.slot_id) || [];

    // Page break if doesn't fit
    if (rowY + cardH > SAFE_BOTTOM) {
      rowY = newContinuationPage();
      col = 0;
      rowMax = 0;
    }

    const cx = MARGIN_X + col * (colW + CARD_GAP);
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

  // Need ~ 260pt of room for totals + notes
  if (rowY + 260 > SAFE_BOTTOM) {
    rowY = newContinuationPage();
  }

  // Totals box (right, max 280pt)
  const totalsW = 280;
  const totalsX = PAGE_W - MARGIN_X - totalsW;
  const totalsH = 130;
  rowY += 12;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(224, 216, 210);
  doc.setLineWidth(0.8);
  doc.roundedRect(totalsX, rowY, totalsW, totalsH, 8, 8, "FD");

  const tx = totalsX + 20;
  const trx = totalsX + totalsW - 20;
  let ty = rowY + 28;
  setFont(doc, "regular", 11);
  doc.setTextColor(...TEXT_SUB);
  doc.text("Subtotal productos", tx, ty);
  setFont(doc, "semibold", 12);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(formatMXN(grandSubtotalProducts), trx, ty, { align: "right" });
  ty += 18;
  setFont(doc, "regular", 11);
  doc.setTextColor(...TEXT_SUB);
  doc.text(`Envío (${input.slots.length} entregas)`, tx, ty);
  setFont(doc, "semibold", 12);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(formatMXN(grandShipping), trx, ty, { align: "right" });
  ty += 18;
  setFont(doc, "regular", 11);
  doc.setTextColor(...TEXT_SUB);
  doc.text("IVA (16%)", tx, ty);
  setFont(doc, "semibold", 12);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(formatMXN(grandIva), trx, ty, { align: "right" });
  ty += 12;
  doc.setDrawColor(224, 216, 210);
  doc.setLineWidth(0.6);
  doc.line(tx, ty, trx, ty);
  ty += 24;
  setFont(doc, "bold", 13);
  doc.setTextColor(...NAVY);
  doc.text("TOTAL:", tx, ty);
  setFont(doc, "bold", 24);
  doc.text(formatMXN(grandTotal), trx, ty + 2, { align: "right" });

  rowY += totalsH + 24;
  if (rowY + 200 > SAFE_BOTTOM) {
    doc.addPage();
    rowY = MARGIN_Y + 8;
  }
  drawNotesBlock(doc, rowY, QUOTE_FOOTER_NOTES.slice(0, 10));

  applyFooterAllPages(doc);

  doc.save(`Berlioz-Multi-Entrega-${format(new Date(), "yyyyMMdd")}.pdf`);
}