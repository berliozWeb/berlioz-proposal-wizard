/**
 * Convierte la descripción cruda de WooCommerce (HTML, a veces escapado y con
 * frases pegadas) en una estructura legible: párrafo intro + bullets + nota.
 */
export interface DescripcionEstructurada {
  intro: string | null;
  items: string[];
  nota: string | null;
}

function decodeAndBreak(html: string): string {
  let text = html;
  for (let i = 0; i < 3; i++) {
    const before = text;
    // Convertir saltos estructurales en \n ANTES de decodificar entidades.
    text = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|div|h[1-6]|tr)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n")
      .replace(/<[^>]*>/g, " ");
    if (typeof DOMParser !== "undefined") {
      text = new DOMParser().parseFromString(text, "text/html").body.textContent || "";
    }
    if (text === before) break;
  }
  return text
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/[\t\r]+/g, " ")
    .replace(/[ ]{2,}/g, " ");
}

function tidy(s: string): string {
  return s
    .replace(/^[\s*•·\-–—]+/, "")
    .replace(/[\s;,·]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function parseDescripcionWoo(
  html: string | null | undefined,
): DescripcionEstructurada {
  const empty: DescripcionEstructurada = { intro: null, items: [], nota: null };
  if (!html) return empty;

  const text = decodeAndBreak(html);

  // Separar en segmentos por saltos de línea, bullets o guiones separadores.
  let segments = text
    .split(/\n+|(?:^|\s)[•·]\s+|\s[-–—]\s/g)
    .map((s) => (s ? tidy(s) : ""))
    .filter((s) => s.length > 1);

  // Si quedó un solo bloque largo, dividir en oraciones.
  if (segments.length === 1 && segments[0].length > 110) {
    segments = segments[0]
      .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ*])/g)
      .map(tidy)
      .filter((s) => s.length > 1);
  }

  // Extraer nota (aclaraciones marcadas con * o que empiezan con "Cambia"/"Nota").
  const notas: string[] = [];
  const rest: string[] = [];
  for (const seg of segments) {
    const raw = seg.trim();
    if (/^\*/.test(raw) || /^\**\s*(nota|cambia|incluye cambio|opcional)\b/i.test(raw)) {
      notas.push(tidy(raw));
    } else {
      rest.push(raw);
    }
  }

  // Deduplicar (Woo repite la descripción corta dentro de la larga).
  const seen = new Set<string>();
  const unique = rest.filter((s) => {
    const key = s.toLowerCase().replace(/[^a-z0-9áéíóúñ ]/gi, "").trim();
    if (!key || seen.has(key)) return false;
    // Descartar si está totalmente contenido en otro segmento más largo.
    for (const other of seen) {
      if (other.includes(key)) return false;
    }
    seen.add(key);
    return true;
  });

  if (unique.length === 0) {
    return { intro: null, items: [], nota: notas.join(" ") || null };
  }

  // Intro: el primer segmento cuando hay varios; si sólo hay uno, es el intro.
  let intro: string | null = null;
  let items: string[] = [];

  if (unique.length === 1) {
    intro = unique[0];
  } else {
    const first = unique[0];
    // Un primer segmento corto funciona mejor como bullet que como párrafo.
    if (first.length >= 40) {
      intro = first;
      items = unique.slice(1);
    } else {
      items = unique;
    }
  }

  items = items
    .map((s) => capitalize(tidy(s)))
    .filter((s) => s.length > 1)
    .map((s) => (/[.!?]$/.test(s) ? s.slice(0, -1) : s));

  return {
    intro: intro ? capitalize(intro) : null,
    items,
    nota: notas.length ? capitalize(tidy(notas.join(" "))) : null,
  };
}
