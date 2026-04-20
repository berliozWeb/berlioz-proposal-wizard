// ═══════════════════════════════════════════════════════════
// Multi-delivery PDF generator
// Reuses the same visual language as ProposalStep.handleExportPDF
// but writes one section per slot + a final summary table.
// Single-delivery flow is untouched; this file is only for multi.
// ═══════════════════════════════════════════════════════════

import { jsPDF } from "jspdf";
import { format } from "date-fns";
import logoImg from "@/assets/berlioz-logo.png";
import { formatMXN } from "@/domain/value-objects/Money";
import { buildProductImageUrl } from "@/lib/imageUtils";
import {
  QUOTE_FOOTER_NOTES,
  QUOTE_VALIDITY_DAYS,
  generateQuoteId,
} from "@/domain/entities/BerliozCatalog";
import type { SlotProposal, ProposalPackage, ProposedProduct } from "@/domain/entities/SmartQuote";

// Brand palette (matches single-delivery PDF)
const PRIMARY: [number, number, number] = [1, 77, 111];
const GOLD: [number, number, number] = [190, 155, 123];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_BG: [number, number, number] = [248, 246, 243];

// Tier display labels
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
}

/** Load remote image as base64 (square-cropped 120×120) */
function loadImageBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2;
        const sy = (img.height - s) / 2;
        ctx.drawImage(img, sx, sy, s, s, 0, 0, 120, 120);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Computes totals consistently with the on-screen summary (uses backend tier.total/subtotal). */
function packageTotals(pkg: ProposalPackage) {
  return {
    subtotal: pkg.subtotal,
    iva: pkg.iva,
    shipping: pkg.shipping,
    total: pkg.total,
  };
}

function drawHeader(doc: jsPDF, margin: number, pageW: number) {
  try {
    doc.addImage(logoImg, "PNG", margin, 12, 30, 8);
  } catch {
    doc.setFontSize(20);
    doc.setTextColor(...PRIMARY);
    doc.text("BERLIOZ", margin, 18);
  }
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("L'art de recevoir — Cotización Gourmet", margin, 27);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(margin, 31, pageW - margin, 31);
}

function drawBrandFooter(doc: jsPDF, margin: number, pageW: number, quoteId: string, validUntil: Date) {
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("Anne Seguy | hola@berlioz.mx | 55 8237 5469", margin, footerY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Válida hasta: ${format(validUntil, "dd/MM/yyyy")} | ID: ${quoteId}`, margin, footerY + 4);
}

/**
 * Draws one slot section (header, products, totals).
 * Adds a new page first (so each entrega starts on its own page).
 */
async function drawSlotSection(
  doc: jsPDF,
  input: MultiPdfSlotInput,
  context: { margin: number; pageW: number; clientName: string; empresa: string; eventLabel: string; postalCode: string; slotNumber: number; totalSlots: number; quoteId: string; validUntil: Date },
) {
  const { margin, pageW, clientName, empresa, eventLabel, postalCode, slotNumber, totalSlots, quoteId, validUntil } = context;
  const contentW = pageW - margin * 2;

  doc.addPage();
  drawHeader(doc, margin, pageW);

  const slot = input.slot;
  const tier = input.slot.tiers.find((t) => t.tier === input.selectedTier);
  if (!tier) return;
  const totals = packageTotals(tier);
  const items: ProposedProduct[] = tier.items;

  // Pre-load images
  const loadedImages = await Promise.all(
    items.map((it) => loadImageBase64(buildProductImageUrl(it.imageUrl ?? null, null) || "")),
  );

  // ── Slot title bar ──
  let y = 40;
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`${slot.label || `Entrega ${slotNumber}`} — ${TIER_LABELS[input.selectedTier] || input.tierLabel}`, margin + 6, y + 9);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Slot ${slotNumber} de ${totalSlots}`, pageW - margin - 4, y + 9, { align: "right" });

  // ── Slot meta (2 columns) ──
  y += 22;
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("RECEPTOR", margin, y);
  doc.text("DETALLES DE LA ENTREGA", 110, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  y += 5;
  doc.text(`Atención: ${clientName || "—"}`, margin, y);
  doc.text(`Fecha: ${slot.date || "—"}`, 110, y);
  y += 4.5;
  doc.text(`Empresa: ${empresa || "—"}`, margin, y);
  doc.text(`Hora: ${slot.time || "—"}`, 110, y);
  y += 4.5;
  doc.text(`Evento: ${eventLabel}`, margin, y);
  doc.text(`Personas: ${slot.guests_count}`, 110, y);
  y += 4.5;
  doc.text(`CP: ${postalCode || "—"}`, margin, y);
  doc.text(`Tier elegido: ${TIER_LABELS[input.selectedTier] || input.tierLabel}`, 110, y);

  // ── Product cards ──
  y += 10;
  const cardH = 22;
  const imgSize = 16;
  const cardPad = 3;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const lineTotal = item.unitPrice * item.quantity;

    if (y + cardH + 4 > 270) {
      doc.addPage();
      drawHeader(doc, margin, pageW);
      y = 40;
    }

    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT_BG);
      doc.roundedRect(margin, y - 1, contentW, cardH, 1.5, 1.5, "F");
    }

    const imgData = loadedImages[i];
    const imgX = margin + cardPad;
    const imgY = y + (cardH - imgSize) / 2;
    if (imgData) {
      try {
        doc.addImage(imgData, "JPEG", imgX, imgY, imgSize, imgSize);
      } catch {
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 1, 1, "F");
      }
    } else {
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(imgX, imgY, imgSize, imgSize, 1, 1, "F");
    }

    const textX = imgX + imgSize + 4;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(item.productName, textX, y + 8);

    if (item.recommendationReason) {
      doc.setFontSize(6);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "italic");
      const reason = item.recommendationReason.length > 60
        ? item.recommendationReason.slice(0, 57) + "..."
        : item.recommendationReason;
      doc.text(`💡 ${reason}`, textX, y + 13);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`${item.quantity} × ${formatMXN(item.unitPrice)}`, pageW - margin - 40, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(formatMXN(lineTotal), pageW - margin - 2, y + 8, { align: "right" });

    y += cardH + 2;
  }

  // ── Slot totals ──
  if (y + 50 > 270) {
    doc.addPage();
    drawHeader(doc, margin, pageW);
    y = 40;
  }
  y += 4;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const totalsX = 140;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Subtotal:", totalsX, y);
  doc.text(formatMXN(totals.subtotal), pageW - margin, y, { align: "right" });
  y += 5;
  doc.text("Logística y Envío:", totalsX, y);
  doc.text(formatMXN(totals.shipping), pageW - margin, y, { align: "right" });
  y += 5;
  doc.text("IVA (16%):", totalsX, y);
  doc.text(formatMXN(totals.iva), pageW - margin, y, { align: "right" });
  y += 7;

  doc.setFillColor(...PRIMARY);
  doc.roundedRect(totalsX - 4, y - 5, pageW - margin - totalsX + 8, 12, 2, 2, "F");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("SUBTOTAL ENTREGA:", totalsX, y + 3);
  doc.text(formatMXN(totals.total), pageW - margin, y + 3, { align: "right" });

  y += 14;
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  const perPerson = Math.round(totals.total / Math.max(1, slot.guests_count));
  doc.text(`${formatMXN(perPerson)}/persona`, pageW - margin, y, { align: "right" });

  drawBrandFooter(doc, margin, pageW, quoteId, validUntil);
}

/** Cover page: client + grand total */
function drawCover(
  doc: jsPDF,
  ctx: { margin: number; pageW: number; clientName: string; empresa: string; eventLabel: string; postalCode: string; slotsCount: number; grandTotal: number; quoteId: string; validUntil: Date },
) {
  const { margin, pageW, clientName, empresa, eventLabel, postalCode, slotsCount, grandTotal, quoteId, validUntil } = ctx;
  const contentW = pageW - margin * 2;

  drawHeader(doc, margin, pageW);

  let y = 50;
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("PROPUESTA MULTI-ENTREGA", margin, y);
  y += 8;
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(`${empresa || "Tu Evento"}`, margin, y);
  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "normal");
  doc.text(eventLabel, margin, y);

  // Client info card
  y += 16;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentW, 36, 2, 2, "F");
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin + 6, y + 8);
  doc.text("EVENTO", 110, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Atención: ${clientName || "—"}`, margin + 6, y + 16);
  doc.text(`CP: ${postalCode || "—"}`, margin + 6, y + 22);
  doc.text(`Empresa: ${empresa || "—"}`, margin + 6, y + 28);
  doc.text(`Tipo: ${eventLabel}`, 110, y + 16);
  doc.text(`Entregas: ${slotsCount}`, 110, y + 22);
  doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy")}`, 110, y + 28);

  // Grand total banner
  y += 50;
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(margin, y, contentW, 30, 3, 3, "F");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL GENERAL DEL EVENTO", margin + 8, y + 11);
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(formatMXN(grandTotal), pageW - margin - 8, y + 21, { align: "right" });

  // Intro
  y += 42;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  const intro = `Estimado/a ${clientName || "cliente"}, en Berlioz nos entusiasma preparar esta propuesta gastronómica multi-entrega para ${empresa || "su empresa"}. A continuación encontrará el detalle de cada entrega con su menú, productos y subtotal. Al final del documento se incluye un resumen consolidado del evento.`;
  const lines = doc.splitTextToSize(intro, contentW);
  doc.text(lines, margin, y);

  drawBrandFooter(doc, margin, pageW, quoteId, validUntil);
}

/** Final summary page: table of all slots + grand total + notes */
function drawSummary(
  doc: jsPDF,
  ctx: { margin: number; pageW: number; slots: MultiPdfSlotInput[]; grandTotal: number; quoteId: string; validUntil: Date },
) {
  const { margin, pageW, slots, grandTotal, quoteId, validUntil } = ctx;
  const contentW = pageW - margin * 2;

  doc.addPage();
  drawHeader(doc, margin, pageW);

  let y = 44;
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen del evento", margin, y);
  y += 8;

  // Table header
  const colX = {
    entrega: margin,
    fecha: margin + 50,
    hora: margin + 80,
    pax: margin + 100,
    tier: margin + 118,
    sub: pageW - margin,
  };

  doc.setFillColor(...PRIMARY);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("ENTREGA", colX.entrega + 2, y + 5.5);
  doc.text("FECHA", colX.fecha, y + 5.5);
  doc.text("HORA", colX.hora, y + 5.5);
  doc.text("PAX", colX.pax, y + 5.5);
  doc.text("TIER", colX.tier, y + 5.5);
  doc.text("SUBTOTAL", colX.sub - 2, y + 5.5, { align: "right" });
  y += 8;

  // Rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  slots.forEach((s, idx) => {
    if (y + 10 > 260) {
      doc.addPage();
      drawHeader(doc, margin, pageW);
      y = 44;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(...LIGHT_BG);
      doc.rect(margin, y, contentW, 9, "F");
    }
    const label = s.slot.label || `Entrega ${idx + 1}`;
    doc.setFont("helvetica", "bold");
    doc.text(label.length > 28 ? label.slice(0, 26) + "…" : label, colX.entrega + 2, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(s.slot.date || "—", colX.fecha, y + 6);
    doc.text(s.slot.time || "—", colX.hora, y + 6);
    doc.text(String(s.slot.guests_count), colX.pax, y + 6);
    doc.text(TIER_LABELS[s.selectedTier] || s.tierLabel, colX.tier, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text(formatMXN(s.total), colX.sub - 2, y + 6, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 9;
  });

  // Grand total row
  y += 2;
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");
  doc.setFontSize(12);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL GENERAL", margin + 4, y + 9);
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(formatMXN(grandTotal), pageW - margin - 4, y + 9, { align: "right" });

  // Notes
  y += 22;
  if (y + 40 > 270) {
    doc.addPage();
    drawHeader(doc, margin, pageW);
    y = 44;
  }
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY);
  doc.text("NOTAS IMPORTANTES", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  y += 4;
  QUOTE_FOOTER_NOTES.slice(0, 8).forEach((note) => {
    doc.text(`• ${note}`, margin, y);
    y += 3.5;
  });

  drawBrandFooter(doc, margin, pageW, quoteId, validUntil);
}

/** Public entry point — generates and downloads the multi-delivery PDF */
export async function generateMultiDeliveryPdf(input: MultiPdfInput): Promise<void> {
  const doc = new jsPDF();
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const quoteId = generateQuoteId();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + QUOTE_VALIDITY_DAYS);

  const grandTotal = input.slots.reduce((s, x) => s + x.total, 0);

  // Cover (page 1)
  drawCover(doc, {
    margin,
    pageW,
    clientName: input.clientName,
    empresa: input.empresa,
    eventLabel: input.eventLabel,
    postalCode: input.postalCode,
    slotsCount: input.slots.length,
    grandTotal,
    quoteId,
    validUntil,
  });

  // One section per slot
  for (let i = 0; i < input.slots.length; i++) {
    await drawSlotSection(doc, input.slots[i], {
      margin,
      pageW,
      clientName: input.clientName,
      empresa: input.empresa,
      eventLabel: input.eventLabel,
      postalCode: input.postalCode,
      slotNumber: i + 1,
      totalSlots: input.slots.length,
      quoteId,
      validUntil,
    });
  }

  // Final summary
  drawSummary(doc, { margin, pageW, slots: input.slots, grandTotal, quoteId, validUntil });

  doc.save(`Berlioz-Multi-Entrega-${format(new Date(), "yyyyMMdd")}.pdf`);
}
