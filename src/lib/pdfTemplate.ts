// ═══════════════════════════════════════════════════════════
// Berlioz — Shared PDF template (single + multi delivery)
// pt-based A4 layout that mirrors the official quote design:
// Montserrat type, navy header table, cream/pink notes block,
// big right-aligned totals, hero image full bleed, etc.
// ═══════════════════════════════════════════════════════════

import { jsPDF } from "jspdf";
import heroCoffee from "@/assets/food-berlioz2.png";
import heroBreakfast from "@/assets/food-breakfast.jpg";
import heroLunch from "@/assets/food-boxlunch.jpg";
import heroSalad from "@/assets/food-salad.jpg";
import heroDefault from "@/assets/hero-catering.jpg";

// ── Brand palette (per spec) ───────────────────────────────
export const NAVY: [number, number, number] = [1, 77, 111];      // #014D6F
export const CREAM_BG: [number, number, number] = [253, 250, 247]; // #FDFAF7
export const ROSE_PALE: [number, number, number] = [247, 232, 223]; // #F7E8DF
export const BORDER_TAN: [number, number, number] = [206, 193, 185]; // #CEC1B9
export const RULE_SOFT: [number, number, number] = [224, 216, 210];  // #E0D8D2
export const ROW_RULE: [number, number, number] = [240, 234, 229];   // #F0EAE5
export const TEXT_MAIN: [number, number, number] = [26, 26, 26];     // #1A1A1A
export const TEXT_SUB: [number, number, number] = [85, 85, 85];      // #555
export const TEXT_MUTED_HEX: [number, number, number] = [153, 153, 153]; // #999

// Back-compat aliases (kept so other imports still resolve)
export const TEAL = NAVY;
export const CREAM_BANNER = ROSE_PALE;
export const CREAM_SOFT = ROSE_PALE;
export const CREAM_LINE = BORDER_TAN;
export const TEXT_DARK = TEXT_MAIN;
export const TEXT_MUTED = TEXT_SUB;
export const HAIRLINE = RULE_SOFT;

// ── Layout constants (A4, pt) ──────────────────────────────
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MARGIN_X = 40;
export const MARGIN_Y = 32;
export const HERO_H = 220;

// Legacy exports (mm-based) — left as 0 to avoid accidental use
export const MARGIN = MARGIN_X;
export const HEADER_H = MARGIN_Y;

// ── Montserrat loader (TTF embedded into jsPDF) ────────────
const FONT_URLS = {
  regular:  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/static/Montserrat-Regular.ttf",
  semibold: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/static/Montserrat-SemiBold.ttf",
  bold:     "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/static/Montserrat-Bold.ttf",
};
const fontCache: Partial<Record<keyof typeof FONT_URLS, string>> = {};
let montserratReady = false;

async function fetchFontB64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  } catch { return null; }
}

/** Pre-load Montserrat (call once before instantiating the PDF). */
export async function ensureMontserrat(): Promise<boolean> {
  if (montserratReady) return true;
  const keys = Object.keys(FONT_URLS) as Array<keyof typeof FONT_URLS>;
  const results = await Promise.all(keys.map(async (k) => {
    if (fontCache[k]) return true;
    const b64 = await fetchFontB64(FONT_URLS[k]);
    if (b64) { fontCache[k] = b64; return true; }
    return false;
  }));
  montserratReady = results.every(Boolean);
  return montserratReady;
}

/** Register the cached fonts on a jsPDF instance. */
export function registerMontserrat(doc: jsPDF): boolean {
  if (!fontCache.regular || !fontCache.bold || !fontCache.semibold) return false;
  try {
    doc.addFileToVFS("Montserrat-Regular.ttf",  fontCache.regular);
    doc.addFont("Montserrat-Regular.ttf",  "Montserrat", "normal");
    doc.addFileToVFS("Montserrat-SemiBold.ttf", fontCache.semibold);
    doc.addFont("Montserrat-SemiBold.ttf", "Montserrat", "semibold");
    doc.addFileToVFS("Montserrat-Bold.ttf", fontCache.bold);
    doc.addFont("Montserrat-Bold.ttf",     "Montserrat", "bold");
    return true;
  } catch { return false; }
}

/** Apply a Montserrat weight (falls back to helvetica when not registered). */
export function setFont(
  doc: jsPDF,
  weight: "regular" | "semibold" | "bold",
  sizePt: number,
) {
  doc.setFontSize(sizePt);
  const fonts = doc.getFontList();
  if ((fonts as Record<string, unknown>).Montserrat) {
    const style = weight === "regular" ? "normal" : weight;
    doc.setFont("Montserrat", style);
  } else {
    doc.setFont("helvetica", weight === "regular" ? "normal" : "bold");
  }
}

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

/* ═══════════════════════════════════════════════════════════
 * High-level layout primitives (pt units)
 * ═══════════════════════════════════════════════════════════ */

/** Top BERLIOZ wordmark centered. Returns the next y position. */
export function drawHeaderLogo(doc: jsPDF): number {
  setFont(doc, "bold", 28);
  doc.setTextColor(...NAVY);
  doc.setCharSpace(8.4); // ~0.3em at 28pt ≈ 8.4pt
  doc.text("BERLIOZ", PAGE_W / 2, MARGIN_Y + 24, { align: "center" });
  doc.setCharSpace(0);
  return MARGIN_Y + 28 + 16; // logo bottom + 16pt margin
}

/** Full-bleed hero image. Returns the next y position. */
export async function drawHeroFull(doc: jsPDF, yTop: number, assetUrl: string): Promise<number> {
  const data = await loadImageBase64(assetUrl, { w: 1200, h: 420 });
  if (data) {
    try {
      doc.addImage(data, "JPEG", 0, yTop, PAGE_W, HERO_H);
      return yTop + HERO_H;
    } catch { /* fall through */ }
  }
  // Cream→rose gradient placeholder (faked with two bands)
  doc.setFillColor(...CREAM_BG);
  doc.rect(0, yTop, PAGE_W, HERO_H / 2, "F");
  doc.setFillColor(...ROSE_PALE);
  doc.rect(0, yTop + HERO_H / 2, PAGE_W, HERO_H / 2, "F");
  return yTop + HERO_H;
}

/** Right-aligned quote id under the hero. */
export function drawQuoteId(doc: jsPDF, y: number, quoteId: string): number {
  setFont(doc, "bold", 11);
  doc.setTextColor(...NAVY);
  doc.text(`Cotización ${quoteId}`, PAGE_W - MARGIN_X, y + 14, { align: "right" });
  return y + 22;
}

/** Thin tan horizontal rule across the content width. */
export function drawRule(doc: jsPDF, y: number) {
  doc.setDrawColor(...RULE_SOFT);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
}

/** Section label (uppercase navy small caps). */
export function drawLabel(doc: jsPDF, label: string, x: number, y: number) {
  setFont(doc, "semibold", 9);
  doc.setTextColor(...NAVY);
  doc.setCharSpace(1.35); // ~0.15em at 9pt
  doc.text(label.toUpperCase(), x, y);
  doc.setCharSpace(0);
}

/** Two-column field block. Each "field" is [label, value]. */
export function drawTwoColFields(
  doc: jsPDF,
  y: number,
  left: { title: string; fields: Array<[string, string]> },
  right: { title: string; fields: Array<[string, string]> },
): number {
  const gap = 60;
  const colW = (PAGE_W - MARGIN_X * 2 - gap) / 2;
  const rightX = MARGIN_X + colW + gap;

  drawRule(doc, y);
  let cy = y + 22;

  drawLabel(doc, left.title, MARGIN_X, cy);
  drawLabel(doc, right.title, rightX, cy);
  cy += 16;

  const rows = Math.max(left.fields.length, right.fields.length);
  const lineH = 16;
  for (let i = 0; i < rows; i++) {
    const l = left.fields[i];
    const r = right.fields[i];
    if (l) drawField(doc, MARGIN_X, cy, l[0], l[1], colW);
    if (r) drawField(doc, rightX, cy, r[0], r[1], colW);
    cy += lineH;
  }
  cy += 8;
  drawRule(doc, cy);
  return cy + 12;
}

function drawField(doc: jsPDF, x: number, y: number, label: string, value: string, maxW: number) {
  setFont(doc, "bold", 11);
  doc.setTextColor(...TEXT_MAIN);
  const lbl = `${label}:`;
  doc.text(lbl, x, y);
  const lblW = doc.getTextWidth(lbl + " ");
  setFont(doc, "regular", 11);
  doc.setTextColor(51, 51, 51); // #333
  const v = doc.splitTextToSize(value || "—", Math.max(40, maxW - lblW))[0];
  doc.text(v, x + lblW, y);
}

/** Concepts table header (navy bar with white text). */
export function drawTableHeader(doc: jsPDF, y: number): number {
  const contentW = PAGE_W - MARGIN_X * 2;
  const h = 28;
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN_X, y, contentW, h, "F");
  setFont(doc, "semibold", 10);
  doc.setTextColor(255, 255, 255);
  doc.setCharSpace(1.0);
  const cols = colXs();
  doc.text("#",          cols.idx,   y + 18);
  doc.text("DESCRIPCIÓN", cols.desc,  y + 18);
  doc.text("CANT.",      cols.qty,   y + 18, { align: "right" });
  doc.text("P. UNIT.",   cols.unit,  y + 18, { align: "right" });
  doc.text("SUBTOTAL",   cols.sub,   y + 18, { align: "right" });
  doc.setCharSpace(0);
  return y + h;
}

export function colXs() {
  const left = MARGIN_X;
  const right = PAGE_W - MARGIN_X;
  const W = right - left;
  return {
    idx:    left + W * 0.025,
    desc:   left + W * 0.06,
    qty:    left + W * 0.78,
    unit:   left + W * 0.88,
    sub:    right - 12,
    imgX:   left + W * 0.06,
    imgSize: 56,
    textX:  left + W * 0.06 + 56 + 14,
    textWLimit: W * 0.65 - 70,
  };
}

/** Bottom footer line. */
export function drawBottomFooter(doc: jsPDF) {
  const y = PAGE_H - MARGIN_Y - 12;
  doc.setDrawColor(...RULE_SOFT);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
  setFont(doc, "regular", 9);
  doc.setTextColor(...TEXT_MUTED_HEX);
  doc.text(
    "BERLIOZ  ·  Comida Fantástica  ·  CDMX desde 2015  ·  berlioz.mx  ·  hola@berlioz.mx  ·  55 8237 5469",
    PAGE_W / 2,
    y + 16,
    { align: "center" },
  );
}

/** Apply the bottom footer to every page. */
export function applyFooterAllPages(doc: jsPDF) {
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    drawBottomFooter(doc);
  }
}

// ── Back-compat shims (so legacy callers don't crash) ──
export function drawTopBanner(doc: jsPDF) {
  drawHeaderLogo(doc);
}
export async function drawHero(doc: jsPDF, asset: string) {
  await drawHeroFull(doc, MARGIN_Y + 60, asset);
}
export function drawQuoteIdBar(doc: jsPDF, y: number, quoteId: string): number {
  return drawQuoteId(doc, y, quoteId);
}
export function drawSectionLabel(doc: jsPDF, label: string, y: number) {
  drawLabel(doc, label, MARGIN_X, y);
}
export function drawCompactHeader(doc: jsPDF, rightText: string) {
  setFont(doc, "bold", 14);
  doc.setTextColor(...NAVY);
  doc.setCharSpace(3);
  doc.text("BERLIOZ", MARGIN_X, MARGIN_Y + 14);
  doc.setCharSpace(0);
  setFont(doc, "bold", 9);
  doc.text(rightText, PAGE_W - MARGIN_X, MARGIN_Y + 14, { align: "right" });
  doc.setDrawColor(...RULE_SOFT);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_X, MARGIN_Y + 22, PAGE_W - MARGIN_X, MARGIN_Y + 22);
}
export function drawBottomBand(doc: jsPDF) { drawBottomFooter(doc); }
export function drawInfoColumns(
  doc: jsPDF,
  y: number,
  left: { title: string; lines: Array<[string, string]> },
  right: { title: string; lines: Array<[string, string]> },
  _opts?: { boxed?: boolean },
): number {
  return drawTwoColFields(doc, y,
    { title: left.title, fields: left.lines },
    { title: right.title, fields: right.lines });
}
export function drawNotesAndBrand(doc: jsPDF, y: number, notes: string[]): number {
  return drawNotesBlock(doc, y, notes);
}
export function drawNotesBox(doc: jsPDF, y: number, notes: string[]): number {
  return drawNotesBlock(doc, y, notes);
}

/* ═══ Notes + Brand block (pink, 2-col) ═══ */
export function drawNotesBlock(doc: jsPDF, y: number, notes: string[]): number {
  const contentW = PAGE_W - MARGIN_X * 2;
  const padding = 24;
  const leftW = contentW * 0.65 - padding;
  const rightW = contentW * 0.35 - padding;
  const leftX = MARGIN_X + padding;
  const rightX = MARGIN_X + contentW * 0.65 + padding;

  // Compute height
  const lineH = 14; // 10pt * 1.4
  const titleH = 22;
  setFont(doc, "regular", 10);
  let bulletLines = 0;
  const wrapped: string[][] = [];
  for (const n of notes) {
    const lines = doc.splitTextToSize(`•  ${n}`, leftW);
    wrapped.push(lines);
    bulletLines += lines.length;
  }
  const leftBlockH = titleH + bulletLines * lineH + 8;
  const rightBlockH = 22 + 30 + 16 + 16 + 16; // logo + name + email + tel
  const blockH = Math.max(leftBlockH, rightBlockH) + padding;

  doc.setFillColor(...ROSE_PALE);
  doc.roundedRect(MARGIN_X, y, contentW, blockH, 8, 8, "F");

  // Left title + bullets
  drawLabel(doc, "Notas y condiciones", leftX, y + padding);
  setFont(doc, "regular", 10);
  doc.setTextColor(...TEXT_MAIN);
  let cy = y + padding + 22;
  for (const lines of wrapped) {
    doc.text(lines, leftX, cy);
    cy += lines.length * lineH;
  }

  // Right: brand card
  const rCenterX = rightX + rightW / 2;
  let ry = y + padding + 8;
  setFont(doc, "bold", 22);
  doc.setTextColor(...NAVY);
  doc.setCharSpace(5);
  doc.text("BERLIOZ", rCenterX, ry + 18, { align: "center" });
  doc.setCharSpace(0);
  ry += 36;
  setFont(doc, "regular", 11);
  doc.setTextColor(51, 51, 51);
  doc.text("Berlioz Catering Gourmet", rCenterX, ry, { align: "center" });
  ry += 16;
  doc.text("hola@berlioz.mx", rCenterX, ry, { align: "center" });
  ry += 16;
  doc.text("55 8237 5469", rCenterX, ry, { align: "center" });

  return y + blockH;
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