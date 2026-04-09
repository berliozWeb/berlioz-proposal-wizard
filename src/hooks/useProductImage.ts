import { useState, useEffect } from 'react';
import { buildProductImageUrl, buildImagePrompt } from '@/lib/imageUtils';
import { supabase } from '@/integrations/supabase/client';

interface ProductImageInput {
  id: string;
  nombre: string;
  imagen?: string | null;
  imagen_url?: string | null;
  imageUrl?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
}

export function useProductImage(product: ProductImageInput) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    buildProductImageUrl(product.imagen_url || product.imageUrl, product.imagen)
  );
  const [isGenerated, setIsGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we already have a real image, done
    if (imageUrl) return;

    let cancelled = false;

    const generateImage = async () => {
      setLoading(true);
      try {
        const prompt = buildImagePrompt(product);
        const { data } = await supabase.functions.invoke('generate-product-image', {
          body: { productId: product.id, prompt },
        });
        if (!cancelled && data?.url) {
          setImageUrl(data.url);
          setIsGenerated(true);
        }
      } catch (err) {
        console.warn('Image generation failed for', product.nombre);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    generateImage();
    return () => { cancelled = true; };
  }, [product.id]);

  return { imageUrl, isGenerated, loading };
}
