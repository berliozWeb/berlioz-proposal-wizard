// ═══════════════════════════════════════════════════════════
// Berlioz — Shared PDF template (single + multi delivery)
// pt-based A4 layout that mirrors the official quote design:
// Montserrat type, navy header table, cream/pink notes block,
// big right-aligned totals, hero image full bleed, etc.
// ═══════════════════════════════════════════════════════════

import { jsPDF } from "jspdf";
import berliozLogo from "@/assets/berlioz-logo.png";
import heroDefault from "@/assets/hero-catering.jpg";
import heroBreakfast from "@/assets/food-breakfast.jpg";
import heroCoffee from "@/assets/food-berlioz2.png";
import heroLunch from "@/assets/food-boxlunch.jpg";
import heroSalad from "@/assets/food-salad.jpg";

// ── Berlioz palette (matches backoffice spec exactly) ──────
export const NAVY: [number, number, number] = [0, 86, 107];        // #00566B
export const ROSA: [number, number, number] = [242, 221, 213];     // #F2DDD5
export const ROSA_SOFT: [number, number, number] = [249, 250, 251]; // #F9FAFB
export const TEXT: [number, number, number] = [34, 34, 34];         // #222
export const TEXT_SOFT: [number, number, number] = [68, 68, 68];    // #444
export const MUTED: [number, number, number] = [119, 119, 119];     // #777
export const MUTED_DARK: [number, number, number] = [102, 102, 102];// #666
export const HAIRLINE: [number, number, number] = [229, 231, 235];  // #E5E7EB
export const WHITE: [number, number, number] = [255, 255, 255];

// Back-compat aliases — keep so any legacy import still resolves
export const TEAL = NAVY;
export const CREAM_BG = ROSA;
export const ROSE_PALE = ROSA;
export const CREAM_BANNER = ROSA;
export const CREAM_SOFT = ROSA_SOFT;
export const CREAM_LINE = ROSA;
export const BORDER_TAN = HAIRLINE;
export const RULE_SOFT = HAIRLINE;
export const ROW_RULE = ROSA;
export const TEXT_MAIN = TEXT;
export const TEXT_SUB = TEXT_SOFT;
export const TEXT_MUTED = MUTED;
export const TEXT_MUTED_HEX = MUTED;
export const TEXT_DARK = TEXT;

// ── Layout (A4, mm) ────────────────────────────────────────
export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN_X = 16;
export const MARGIN_BOTTOM = 18;
export const CONTENT_W = PAGE_W - MARGIN_X * 2;

// Legacy aliases kept (some callers still reference these names)
export const MARGIN_Y = MARGIN_X;
export const MARGIN = MARGIN_X;
export const HEADER_H = 28;
export const HERO_H = CONTENT_W / 3;

export const BERLIOZ_LOGO_URL = berliozLogo;

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

/** Load an image and return a data URL (no cropping). */
export function loadImageAsDataURL(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    if (src.startsWith("data:")) return resolve(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        const isPng = src.toLowerCase().includes(".png") || src.startsWith("data:image/png");
        resolve(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.85));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function getImageFormat(dataUrl: string): "JPEG" | "PNG" | "WEBP" {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

// ── Image loader with optional cover-crop (used for thumbnails / hero) ──
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
 * High-level layout primitives (mm units)
 * Mirrors the backoffice generateMultiDayPDF / PDFPreviewContent
 * ═══════════════════════════════════════════════════════════ */

/** Rosa banner header (28mm) with centered Berlioz logo. */
export function drawRosaHeader(doc: jsPDF, logoData: string | null) {
  const h = HEADER_H;
  doc.setFillColor(...ROSA);
  doc.rect(0, 0, PAGE_W, h, "F");
  if (logoData) {
    const w = 30, lh = 16;
    try { doc.addImage(logoData, "PNG", (PAGE_W - w) / 2, (h - lh) / 2, w, lh, undefined, "FAST"); return; }
    catch { /* fall through */ }
  }
  setFont(doc, "bold", 16);
  doc.setTextColor(...NAVY);
  doc.text("BERLIOZ", PAGE_W / 2, 18, { align: "center" });
}

/** Rosa footer band (14mm) — call once per page. */
export function drawRosaFooter(doc: jsPDF) {
  const fh = 14;
  const fy = PAGE_H - fh;
  doc.setFillColor(...ROSA);
  doc.rect(0, fy, PAGE_W, fh, "F");
  setFont(doc, "regular", 7);
  doc.setTextColor(...NAVY);
  doc.text(
    "BERLIOZ · Comida Fantástica · CDMX desde 2015 · berlioz.mx · hola@berlioz.mx · 55 8237 5469",
    PAGE_W / 2, fy + 8.5, { align: "center" },
  );
}

/** Apply rosa footer to every page in the document. */
export function applyFooterAllPages(doc: jsPDF) {
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    drawRosaFooter(doc);
  }
}

/** Hero image inside the content margins (3:1). Placeholder if none. */
export function drawHeroImage(doc: jsPDF, y: number, h: number, imgData: string | null) {
  if (imgData) {
    try {
      doc.addImage(imgData, getImageFormat(imgData), MARGIN_X, y, CONTENT_W, h, undefined, "FAST");
      return;
    } catch { /* fall through */ }
  }
  doc.setFillColor(...ROSA);
  doc.rect(MARGIN_X, y, CONTENT_W, h, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(14);
  doc.text("L'art de recevoir", PAGE_W / 2, y + h / 2 + 2, { align: "center" });
}

/** Section label (uppercase navy small caps) with rosa rule. */
export function drawSectionLabel(doc: jsPDF, label: string, y: number) {
  setFont(doc, "bold", 9);
  doc.setTextColor(...NAVY);
  doc.text(label.toUpperCase(), MARGIN_X, y);
  const labelW = doc.getTextWidth(label.toUpperCase());
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X + labelW + 4, y - 1.5, PAGE_W - MARGIN_X, y - 1.5);
}

/** Right-aligned cotización folio + rosa separator. Returns next y. */
export function drawQuoteFolio(doc: jsPDF, y: number, quoteId: string): number {
  setFont(doc, "bold", 10);
  doc.setTextColor(...NAVY);
  doc.text(`Cotización ${quoteId}`, PAGE_W - MARGIN_X, y, { align: "right" });
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_X, y + 4, PAGE_W - MARGIN_X, y + 4);
  return y + 12;
}

/** Placeholder square (rosa with "B"). */
export function drawProductPlaceholder(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(...ROSA);
  doc.rect(x, y, size, size, "F");
  setFont(doc, "bold", 9);
  doc.setTextColor(...NAVY);
  doc.text("B", x + size / 2, y + size / 2 + 1.5, { align: "center" });
}

/** Single product row (image + name + desc + qty×unit + subtotal). Returns new y. */
export function drawProductRow(
  doc: jsPDF,
  y: number,
  opts: { name: string; description?: string; qty: number; unitPrice: number; imgData: string | null },
): number {
  const ROW_H = 22;
  const IMG_SIZE = 18;
  const fmt = formatMXNmm;
  const imgX = MARGIN_X;
  const imgY = y + 1;
  if (opts.imgData) {
    try { doc.addImage(opts.imgData, getImageFormat(opts.imgData), imgX, imgY, IMG_SIZE, IMG_SIZE, undefined, "FAST"); }
    catch { drawProductPlaceholder(doc, imgX, imgY, IMG_SIZE); }
  } else {
    drawProductPlaceholder(doc, imgX, imgY, IMG_SIZE);
  }

  const textX = imgX + IMG_SIZE + 6;
  const rightColW = 50;
  const centerW = CONTENT_W - IMG_SIZE - 6 - rightColW - 4;
  setFont(doc, "bold", 11);
  doc.setTextColor(...TEXT);
  const nameLines = doc.splitTextToSize(opts.name, centerW);
  doc.text(nameLines[0], textX, y + 6);

  if (opts.description) {
    setFont(doc, "regular", 8);
    doc.setTextColor(...MUTED);
    const descLines = doc.splitTextToSize(opts.description, centerW);
    doc.text(descLines.slice(0, 2), textX, y + 11);
  }

  const rightX = PAGE_W - MARGIN_X;
  const sub = opts.qty * opts.unitPrice;
  setFont(doc, "regular", 9);
  doc.setTextColor(...MUTED_DARK);
  doc.text(`${opts.qty} × ${fmt(opts.unitPrice)}`, rightX, y + 6, { align: "right" });
  setFont(doc, "bold", 12);
  doc.setTextColor(...TEXT);
  doc.text(fmt(sub), rightX, y + 14, { align: "right" });

  const newY = y + ROW_H;
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, newY, PAGE_W - MARGIN_X, newY);
  return newY + 2;
}

/** Right-aligned totals block (90mm wide). Returns new y after rosa bar. */
export function drawTotalsBox(
  doc: jsPDF,
  y: number,
  rows: Array<[string, number]>,
  totalLabel: string,
  totalValue: number,
): number {
  const fmt = formatMXNmm;
  const w = 90;
  const x = PAGE_W - MARGIN_X - w;
  let cy = y;
  for (const [label, value] of rows) {
    setFont(doc, "regular", 9);
    doc.setTextColor(...MUTED_DARK);
    doc.text(label, x, cy + 4);
    setFont(doc, "bold", 9);
    doc.setTextColor(...TEXT);
    doc.text(fmt(value), x + w - 2, cy + 4, { align: "right" });
    cy += 6;
  }
  cy += 2;
  doc.setFillColor(...ROSA);
  doc.rect(x, cy, w, 12, "F");
  setFont(doc, "bold", 11);
  doc.setTextColor(...NAVY);
  doc.text(totalLabel, x + 4, cy + 8);
  doc.text(fmt(totalValue), x + w - 4, cy + 8, { align: "right" });
  return cy + 14;
}

/** Notes + brand card (rosa, two columns). Returns new y. */
export function drawNotesAndBrand(
  doc: jsPDF,
  y: number,
  notes: string[],
  logoData: string | null,
): number {
  const notesH = Math.max(38, 12 + notes.length * 5 + 6);
  doc.setFillColor(...ROSA);
  doc.roundedRect(MARGIN_X, y, CONTENT_W, notesH, 2.5, 2.5, "F");

  const notesColW = CONTENT_W * 0.62;
  const brandColX = MARGIN_X + notesColW + 8;
  const brandColW = CONTENT_W * 0.38;

  setFont(doc, "bold", 8);
  doc.setTextColor(...NAVY);
  doc.text("NOTAS Y CONDICIONES", MARGIN_X + 6, y + 8);
  setFont(doc, "regular", 8);
  doc.setTextColor(...TEXT_SOFT);
  let ny = y + 14;
  for (const n of notes) {
    const lines = doc.splitTextToSize(`◆  ${n}`, notesColW - 12);
    doc.text(lines, MARGIN_X + 6, ny);
    ny += lines.length * 4 + 1;
  }

  const brandCx = brandColX + brandColW / 2 - 4;
  if (logoData) {
    const lw = 22, lh = 11;
    try { doc.addImage(logoData, "PNG", brandCx - lw / 2, y + 8, lw, lh, undefined, "FAST"); }
    catch { /* skip */ }
  }
  setFont(doc, "bold", 8);
  doc.setTextColor(...NAVY);
  doc.text("Berlioz Catering Gourmet", brandCx, y + 24, { align: "center" });
  setFont(doc, "regular", 8);
  doc.setTextColor(...MUTED_DARK);
  doc.text("hola@berlioz.mx", brandCx, y + 29, { align: "center" });
  doc.text("55 8237 5469", brandCx, y + 33, { align: "center" });

  return y + notesH;
}

/** Guard: add a new page (with rosa footer) when content overflows. */
export function ensureSpace(doc: jsPDF, y: number, needed: number, headerFn?: (doc: jsPDF) => number): number {
  if (y + needed > PAGE_H - MARGIN_BOTTOM - 4) {
    doc.addPage();
    return headerFn ? headerFn(doc) : 20;
  }
  return y;
}

/** MXN formatter used inside helpers (avoids React import here). */
function formatMXNmm(n: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

/* ═══════════════════════════════════════════════════════════
 * Back-compat shims for callers still using the old API.
 * They forward to the new mm-based primitives.
 * ═══════════════════════════════════════════════════════════ */

export function drawHeaderLogo(doc: jsPDF): number {
  drawRosaHeader(doc, null);
  return HEADER_H + 4;
}
export async function drawHeroFull(doc: jsPDF, yTop: number, assetUrl: string): Promise<number> {
  const data = await loadImageAsDataURL(assetUrl);
  const h = HERO_H;
  drawHeroImage(doc, yTop, h, data);
  return yTop + h;
}
export async function drawHero(doc: jsPDF, asset: string) {
  await drawHeroFull(doc, HEADER_H + 4, asset);
}
export function drawQuoteId(doc: jsPDF, y: number, quoteId: string): number {
  return drawQuoteFolio(doc, y + 4, quoteId);
}
export function drawQuoteIdBar(doc: jsPDF, y: number, quoteId: string): number {
  return drawQuoteFolio(doc, y, quoteId);
}
export function drawRule(doc: jsPDF, y: number) {
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
}
export function drawLabel(doc: jsPDF, label: string, _x: number, y: number) {
  drawSectionLabel(doc, label, y);
}
export function drawTwoColFields(
  doc: jsPDF,
  y: number,
  left: { title: string; fields: Array<[string, string]> },
  right: { title: string; fields: Array<[string, string]> },
): number {
  const colW = (CONTENT_W - 8) / 2;
  const lx = MARGIN_X;
  const rx = MARGIN_X + colW + 8;
  setFont(doc, "bold", 8);
  doc.setTextColor(...NAVY);
  doc.text(left.title.toUpperCase(), lx, y);
  doc.text(right.title.toUpperCase(), rx, y);
  let yL = y + 6, yR = y + 6;
  for (const [k, v] of left.fields) {
    setFont(doc, "bold", 10); doc.setTextColor(...TEXT);
    doc.text(`${k}:`, lx, yL);
    setFont(doc, "regular", 10); doc.setTextColor(...TEXT_SOFT);
    doc.text(v || "—", lx + 22, yL);
    yL += 6;
  }
  for (const [k, v] of right.fields) {
    setFont(doc, "bold", 10); doc.setTextColor(...TEXT);
    doc.text(`${k}:`, rx, yR);
    setFont(doc, "regular", 10); doc.setTextColor(...TEXT_SOFT);
    doc.text(v || "—", rx + 22, yR);
    yR += 6;
  }
  return Math.max(yL, yR) + 4;
}
export function drawInfoColumns(
  doc: jsPDF, y: number,
  left: { title: string; lines: Array<[string, string]> },
  right: { title: string; lines: Array<[string, string]> },
): number {
  return drawTwoColFields(doc, y,
    { title: left.title, fields: left.lines },
    { title: right.title, fields: right.lines });
}
export function drawNotesBlock(doc: jsPDF, y: number, notes: string[]): number {
  return drawNotesAndBrand(doc, y, notes, null);
}
export function drawNotesBox(doc: jsPDF, y: number, notes: string[]): number {
  return drawNotesAndBrand(doc, y, notes, null);
}
export function drawTableHeader(doc: jsPDF, y: number): number {
  // Kept for legacy callers — not used by the new layouts.
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN_X, y, CONTENT_W, 8, "F");
  return y + 8;
}
export function colXs() {
  return {
    idx: MARGIN_X + 4,
    desc: MARGIN_X + 12,
    qty: MARGIN_X + CONTENT_W * 0.73,
    unit: MARGIN_X + CONTENT_W * 0.86,
    sub: PAGE_W - MARGIN_X - 2,
    imgX: MARGIN_X,
    imgSize: 18,
    textX: MARGIN_X + 24,
    textWLimit: CONTENT_W - 80,
  };
}
export function drawBottomFooter(doc: jsPDF) { drawRosaFooter(doc); }
export function drawBottomBand(doc: jsPDF) { drawRosaFooter(doc); }
export function drawTopBanner(doc: jsPDF) { drawRosaHeader(doc, null); }
export function drawCompactHeader(doc: jsPDF, rightText: string) {
  setFont(doc, "bold", 12);
  doc.setTextColor(...NAVY);
  doc.text("BERLIOZ", MARGIN_X, 12);
  setFont(doc, "bold", 9);
  doc.text(rightText, PAGE_W - MARGIN_X, 12, { align: "right" });
  doc.setDrawColor(...ROSA);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_X, 16, PAGE_W - MARGIN_X, 16);
}
