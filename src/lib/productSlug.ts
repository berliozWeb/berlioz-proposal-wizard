/** Decodifica sin romper si el texto trae un % inválido. */
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Normaliza un slug para comparar: decodificado, NFC y en minúsculas. */
export function normalizeSlug(s: string): string {
  return safeDecode(s).normalize("NFC").trim().toLowerCase().replace(/^\/+|\/+$/g, "");
}

/**
 * Extrae el slug de un permalink de berlioz.mx:
 * https://berlioz.mx/producto/{slug}/ → {slug} (decodificado).
 */
export function slugFromPermalink(permalink: string | null | undefined): string | null {
  if (!permalink) return null;
  const m = String(permalink).match(/\/producto\/([^/?#]+)\/?/i);
  return m ? normalizeSlug(m[1]) : null;
}

/** Ruta interna con diagonal final: /producto/{slug}/ */
export function productPath(slug: string): string {
  return `/producto/${encodeURIComponent(slug)}/`;
}
