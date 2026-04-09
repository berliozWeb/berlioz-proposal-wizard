const SUPABASE_STORAGE =
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/imagenes-berlioz`;

/**
 * Resolve product image URL — priority chain:
 * 1. imagen_url (already a full URL)
 * 2. imagen field → build from Supabase storage bucket
 * 3. null → caller should trigger DALL-E generation
 */
export function buildProductImageUrl(
  imagen_url?: string | null,
  imagen?: string | null,
): string | null {
  if (imagen_url) return imagen_url;
  if (imagen) return `${SUPABASE_STORAGE}/${imagen}`;
  return null;
}

/**
 * Build a DALL-E prompt for a product that has no image
 */
export function buildImagePrompt(product: {
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
}): string {
  return `Professional food photography of "${product.nombre}", corporate catering style, ${product.categoria || 'gourmet food'}, elegant plating, soft natural lighting, editorial composition, clean white background, high resolution, appetizing and realistic, Mexican corporate catering premium presentation`;
}
