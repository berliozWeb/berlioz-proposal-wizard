// ═══════════════════════════════════════════════════════════
// Berlioz — Shared PDF template (single + multi delivery)
// Replicates the visual identity of the official PDFs:
// cream banner, hero image, teal hairlines, info cards,
// cream totals and notes blocks, bottom cream band.
// ═══════════════════════════════════════════════════════════

import type { jsPDF } from "jspdf";
import heroCoffee from "@/assets/food-berlioz2.png";
import heroBreakfast from "@/assets/food-breakfast.jpg";
import heroLunch from "@/assets/food-boxlunch.jpg";
import heroSalad from "@/assets/food-salad.jpg";
import heroDefault from "@/assets/heroCoti.JPG";

// ── Palette (RGB tuples — match the reference PDFs) ──
export const TEAL: [number, number, number] = [1, 77, 111];
export const CREAM_BANNER: [number, number, number] = [233, 213, 197];   // #E9D5C5
export const CREAM_SOFT: [number, number, number] = [244, 232, 220];     // #F4E8DC
export const CREAM_LINE: [number, number, number] = [218, 197, 178];     // #DAC5B2
export const TEXT_DARK: [number, number, number] = [38, 38, 38];
export const TEXT_MUTED: [number, number, number] = [110, 110, 110];
export const HAIRLINE: [number, number, number] = [200, 200, 200];

// ── Layout constants (A4, mm) ──
export const MARGIN = 14;
export const HEADER_H = 22;       // cream banner
export const HERO_H = 50;         // hero image strip

// ── Image loader (works for remote + bundled assets) ──
export function loadImageBase64(
  url: string,
  targetSize?: { w: number; h: number },
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        if (targetSize) {
          canvas.width = targetSize.w;
          canvas.height = targetSize.h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          // Cover-fit
          const ratio = Math.max(targetSize.w / img.width, targetSize.h / img.height);
          const dw = img.width * ratio;
          const dh = img.height * ratio;
          const dx = (targetSize.w - dw) / 2;
          const dy = (targetSize.h - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
        } else {
          // Square crop center
          const s = Math.min(img.width, img.height);
          canvas.width = 160;
          canvas.height = 160;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          const sx = (img.width - s) / 2;
          const sy = (img.height - s) / 2;
          ctx.drawImage(img, sx, sy, s, s, 0, 0, 160, 160);
        }
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Pick a hero image (bundled asset) based on event type. */
export function heroAssetForEvent(eventType: string | undefined | null): string {
  const e = (eventType || "").toLowerCase();
  if (e.includes("desayuno") || e.includes("breakfast")) return heroBreakfast;
  if (e.includes("coffee") || e.includes("café") || e.includes("cafe")) return heroCoffee;
  if (e.includes("working") || e.includes("lunch") || e.includes("comida")) return heroLunch;
  if (e.includes("salad") || e.includes("ensalada")) return heroSalad;
  return heroDefault;
}

// ═══════════════════════════════════════════════════════════
// Drawing helpers
// ═══════════════════════════════════════════════════════════

/** Cream banner with centered BERLIOZ wordmark in teal. */
export function drawTopBanner(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...CREAM_BANNER);
  doc.rect(0, 0, pageW, HEADER_H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...TEAL);
  doc.setCharSpace(3);
  doc.text("BERLIOZ", pageW / 2, HEADER_H / 2 + 2.5, { align: "center" });
  doc.setCharSpace(0);
}

/** Full-width hero strip directly under the banner. */
export async function drawHero(doc: jsPDF, assetUrl: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const data = await loadImageBase64(assetUrl, { w: 1200, h: 350 });
  if (data) {
    try {
      doc.addImage(data, "JPEG", 0, HEADER_H, pageW, HERO_H);
      return;
    } catch {
      /* fallthrough */
    }
  }
  doc.setFillColor(...CREAM_SOFT);
  doc.rect(0, HEADER_H, pageW, HERO_H, "F");
}

/** Compact top header for continuation pages (no hero). */
export function drawCompactHeader(doc: jsPDF, rightText: string) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...TEAL);
  doc.setCharSpace(2);
  doc.text("BERLIOZ", MARGIN, 18);
  doc.setCharSpace(0);

  doc.setFontSize(9);
  doc.setTextColor(...TEAL);
  doc.setFont("helvetica", "bold");
  doc.text(rightText, pageW - MARGIN, 18, { align: "right" });

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 22, pageW - MARGIN, 22);
}

/** Teal hairline + right-aligned "Cotización …" label below the hero. */
export function drawQuoteIdBar(doc: jsPDF, y: number, quoteId: string) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEAL);
  doc.text(`Cotización ${quoteId}`, pageW - MARGIN, y + 5, { align: "right" });
}

/** Tiny teal section header (e.g. "ENTREGAS"). */
export function drawSectionLabel(doc: jsPDF, label: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEAL);
  doc.setCharSpace(1.5);
  doc.text(label.toUpperCase(), MARGIN, y);
  doc.setCharSpace(0);
}

/** Two-column info block (titles in teal, body in dark). Returns new y. */
export function drawInfoColumns(
  doc: jsPDF,
  y: number,
  left: { title: string; lines: Array<[string, string]> },
  right: { title: string; lines: Array<[string, string]> },
  opts?: { boxed?: boolean },
): number {
  const pageW = doc.internal.pageSize.getWidth();
  const colW = (pageW - MARGIN * 2 - 6) / 2;
  const rightX = MARGIN + colW + 6;
  const lineH = 4.6;
  const innerPad = opts?.boxed ? 6 : 0;
  const rowsCount = Math.max(left.lines.length, right.lines.length);
  const blockH = 8 + rowsCount * lineH + (opts?.boxed ? 8 : 4);

  if (opts?.boxed) {
    doc.setFillColor(...CREAM_SOFT);
    doc.setDrawColor(...CREAM_LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, colW, blockH, 2, 2, "FD");
    doc.roundedRect(rightX, y, colW, blockH, 2, 2, "FD");
  }

  // Titles
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEAL);
  doc.setCharSpace(1);
  doc.text(left.title.toUpperCase(), MARGIN + innerPad, y + 7);
  doc.text(right.title.toUpperCase(), rightX + innerPad, y + 7);
  doc.setCharSpace(0);

  // Lines
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  let ly = y + 7 + 5;
  for (let i = 0; i < rowsCount; i++) {
    const lRow = left.lines[i];
    const rRow = right.lines[i];
    if (lRow) {
      doc.setFont("helvetica", "bold");
      doc.text(`${lRow[0]}:`, MARGIN + innerPad, ly);
      const labelW = doc.getTextWidth(`${lRow[0]}: `);
      doc.setFont("helvetica", "normal");
      doc.text(lRow[1] || "—", MARGIN + innerPad + labelW, ly);
    }
    if (rRow) {
      doc.setFont("helvetica", "bold");
      doc.text(`${rRow[0]}:`, rightX + innerPad, ly);
      const labelW = doc.getTextWidth(`${rRow[0]}: `);
      doc.setFont("helvetica", "normal");
      doc.text(rRow[1] || "—", rightX + innerPad + labelW, ly);
    }
    ly += lineH;
  }
  return y + blockH;
}

/** Cream bottom band with the canonical Berlioz footer string. */
export function drawBottomBand(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const h = 12;
  doc.setFillColor(...CREAM_BANNER);
  doc.rect(0, pageH - h, pageW, h, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEAL);
  doc.text(
    "BERLIOZ  ·  Comida Fantástica  ·  CDMX desde 2015  ·  berlioz.mx  ·  hola@berlioz.mx  ·  55 8237 5469",
    pageW / 2,
    pageH - h / 2 + 1.5,
    { align: "center" },
  );
}

/** NOTAS Y CONDICIONES cream box (left) + BERLIOZ contact card (right). */
export function drawNotesAndBrand(doc: jsPDF, y: number, notes: string[]): number {
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - MARGIN * 2;
  const notesW = contentW * 0.62;
  const brandX = MARGIN + notesW + 6;
  const brandW = contentW - notesW - 6;
  const lineH = 3.6;
  const blockH = 18 + Math.max(notes.length * lineH, 38);

  // Notes box
  doc.setFillColor(...CREAM_SOFT);
  doc.setDrawColor(...CREAM_LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, notesW, blockH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEAL);
  doc.setCharSpace(1);
  doc.text("NOTAS Y CONDICIONES", MARGIN + 5, y + 7);
  doc.setCharSpace(0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_DARK);
  let ny = y + 12;
  for (const note of notes) {
    if (ny > y + blockH - 4) break;
    doc.text(`•  ${note}`, MARGIN + 5, ny);
    ny += lineH;
  }

  // Brand box
  doc.setFillColor(...CREAM_SOFT);
  doc.roundedRect(brandX, y, brandW, blockH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...TEAL);
  doc.setCharSpace(2);
  doc.text("BERLIOZ", brandX + brandW / 2, y + blockH / 2 - 6, { align: "center" });
  doc.setCharSpace(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Berlioz Catering Gourmet", brandX + brandW / 2, y + blockH / 2 + 1, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("hola@berlioz.mx", brandX + brandW / 2, y + blockH / 2 + 6, { align: "center" });
  doc.text("55 8237 5469", brandX + brandW / 2, y + blockH / 2 + 10, { align: "center" });

  return y + blockH;
}

/** Simple notes box (full width) — used on multi continuation pages. */
export function drawNotesBox(doc: jsPDF, y: number, notes: string[]): number {
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - MARGIN * 2;
  const lineH = 3.8;
  // Two columns of notes
  const half = Math.ceil(notes.length / 2);
  const col1 = notes.slice(0, half);
  const col2 = notes.slice(half);
  const blockH = 14 + Math.max(col1.length, col2.length) * lineH;

  doc.setFillColor(...CREAM_SOFT);
  doc.setDrawColor(...CREAM_LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, contentW, blockH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEAL);
  doc.setCharSpace(1);
  doc.text("NOTAS Y CONDICIONES", MARGIN + 5, y + 7);
  doc.setCharSpace(0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_DARK);
  const colW = contentW / 2 - 8;
  let y1 = y + 12;
  for (const n of col1) {
    const lines = doc.splitTextToSize(`•  ${n}`, colW);
    doc.text(lines, MARGIN + 5, y1);
    y1 += lineH * lines.length;
  }
  let y2 = y + 12;
  for (const n of col2) {
    const lines = doc.splitTextToSize(`•  ${n}`, colW);
    doc.text(lines, MARGIN + 5 + colW + 6, y2);
    y2 += lineH * lines.length;
  }
  return y + blockH;
}