import { useState, useEffect } from 'react';
import { buildProductImageUrl } from '@/lib/imageUtils';

interface ProductImageInput {
  id: string;
  nombre: string;
  imagen?: string | null;
  imagen_url?: string | null;
  imageUrl?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
}

/**
 * Returns the product image URL from the existing fields.
 * NOTE: Auto-generation via DALL-E has been disabled. If no image is available,
 * the consumer is expected to render a category fallback (see useCatalogoCotizador).
 */
export function useProductImage(product: ProductImageInput) {
  const initial = buildProductImageUrl(product.imagen_url || product.imageUrl, product.imagen);
  const [imageUrl, setImageUrl] = useState<string | null>(initial);

  useEffect(() => {
    setImageUrl(buildProductImageUrl(product.imagen_url || product.imageUrl, product.imagen));
  }, [product.id, product.imagen_url, product.imageUrl, product.imagen]);

  return { imageUrl, isGenerated: false, loading: false };
}
