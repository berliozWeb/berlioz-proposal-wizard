import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import Seo, { SITE_URL } from "@/components/seo/Seo";
import BaseLayout from "@/components/layout/BaseLayout";
import NotFound from "@/pages/NotFound";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { mapProducto } from "@/hooks/useMenuCatalogo";
import { normalizeSlug, productPath } from "@/lib/productSlug";
import { cn } from "@/lib/utils";
import type { ProductoCotizador } from "@/hooks/useMenuCotizador";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

/** Busca en el espejo de WooCommerce el producto cuyo permalink termina en /producto/{slug}/ */
async function fetchProductoPorSlug(slug: string): Promise<ProductoCotizador | null> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .eq("woo_source", true)
    .in("tipo", ["simple", "variable"])
    .not("permalink", "is", null);
  if (error) throw new Error(error.message);
  const target = normalizeSlug(slug);
  const row = (data || []).find((r: any) => mapProducto(r).slug === target);
  return row ? mapProducto(row) : null;
}

/** Sugerencias: productos activos del espejo de Woo, ordenados por ventas, excluyendo el actual. */
async function fetchSugerencias(excludeWooId: number | null): Promise<ProductoCotizador[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .eq("woo_source", true)
    .in("tipo", ["simple", "variable"])
    .not("permalink", "is", null)
    .order("total_sales", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (data || [])
    .map((r: any) => mapProducto(r))
    .filter((p) => p.slug && p.woo_id !== excludeWooId)
    .slice(0, 4);
}

export default function ProductDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // Slugs viejos del catálogo estático (con guion bajo) no existen en Woo.
  const invalid = !slug || slug.includes("_");

  // Normaliza a diagonal final sin recargar.
  useEffect(() => {
    if (!location.pathname.endsWith("/")) {
      navigate(`${location.pathname}/${location.search}${location.hash}`, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  const { data: product, isLoading } = useQuery({
    queryKey: ["producto-slug", normalizeSlug(slug)],
    queryFn: () => fetchProductoPorSlug(slug),
    enabled: !invalid,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sugerencias = [] } = useQuery({
    queryKey: ["producto-sugerencias", product?.woo_id ?? null],
    queryFn: () => fetchSugerencias(product?.woo_id ?? null),
    enabled: !!product,
    staleTime: 5 * 60 * 1000,
  });

  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!product) return;
    const def = product.variantes.find((v) => v.es_base) ?? product.variantes[0];
    setSelectedId(def?.variante_id ?? "");
    setQty(1);
    setImgIdx(0);
    window.scrollTo(0, 0);
  }, [product?.product_id]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const g = product.galeria.length > 0 ? product.galeria : [product.img_principal].filter(Boolean);
    return g as string[];
  }, [product]);

  if (invalid) return <NotFound />;

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-muted rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </BaseLayout>
    );
  }

  if (!product) return <NotFound />;

  const variantes = product.variantes;
  const selected = variantes.find((v) => v.variante_id === selectedId) ?? variantes[0];
  const precios = variantes.map((v) => Number(v.precio) || 0).filter((p) => p > 0);
  const low = precios.length ? Math.min(...precios) : 0;
  const high = precios.length ? Math.max(...precios) : 0;
  const canonicalPath = productPath(product.slug!);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const categoria = product.categoria || "Catering";

  const intro = (product.desc_intro || product.desc_corta || "").replace(/\s+/g, " ").trim();
  const fallbackDesc = `${product.nombre} de Berlioz, catering corporativo en CDMX y Área Metropolitana.`;
  const seoDesc = intro
    ? intro.length > 155 ? intro.slice(0, 152).trimEnd() + "…" : intro
    : fallbackDesc;

  const priceSpec = { "@type": "UnitPriceSpecification", priceCurrency: "MXN", valueAddedTaxIncluded: false };
  const offers =
    precios.length > 1 && low !== high
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "MXN",
          lowPrice: low,
          highPrice: high,
          offerCount: precios.length,
          availability: "https://schema.org/InStock",
          url: canonicalUrl,
          priceSpecification: { ...priceSpec, price: low },
        }
      : {
          "@type": "Offer",
          priceCurrency: "MXN",
          price: low,
          availability: "https://schema.org/InStock",
          url: canonicalUrl,
          priceSpecification: { ...priceSpec, price: low },
        };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    description: intro || fallbackDesc,
    image: gallery,
    sku: product.woo_id != null ? String(product.woo_id) : undefined,
    brand: { "@type": "Brand", name: "Berlioz" },
    category: categoria,
    offers,
  };

  const altFor = (i: number) =>
    `${product.nombre} — ${categoria} de Berlioz${gallery.length > 1 ? ` (foto ${i + 1})` : ""}`;

  const handleAdd = () => {
    if (!selected) return;
    addItem({
      id: selected.variante_id,
      name: selected.nombre_display || product.nombre,
      price: selected.precio || 0,
      quantity: qty,
      image: selected.img || product.img_principal || undefined,
      category: product.categoria,
      isPerPerson: true,
      wooProductId: product.woo_id ?? null,
      wooVariationId: selected.woo_variation_id ?? null,
      productoId: product.product_id,
    });
  };

  return (
    <BaseLayout>
      <Seo title={`${product.nombre} | Berlioz`} description={seoDesc} path={canonicalPath} jsonLd={jsonLd} />
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-24">
        <Link to="/menu" className="inline-flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="w-4 h-4" /> Volver al menú
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-3">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-muted border border-border/50">
              {gallery[imgIdx] && (
                <img src={gallery[imgIdx]} alt={altFor(imgIdx)} className="w-full h-full object-cover" />
              )}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={() => setImgIdx((i) => (i === 0 ? gallery.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 flex items-center justify-center text-primary"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Foto siguiente"
                    onClick={() => setImgIdx((i) => (i === gallery.length - 1 ? 0 : i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 flex items-center justify-center text-primary"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {gallery.map((g, i) => (
                  <button
                    key={g + i}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      "w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2",
                      i === imgIdx ? "border-primary" : "border-transparent opacity-70",
                    )}
                  >
                    <img src={g} alt={altFor(i)} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{categoria}</span>
              <h1 className="font-heading text-3xl md:text-4xl text-foreground leading-tight mt-1">{product.nombre}</h1>
              <p className="mt-3 text-2xl font-bold text-foreground">
                {precios.length > 1 && low !== high ? `Desde ${fmt(low)}` : fmt(selected?.precio || low)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">por pieza + IVA</span>
              </p>
            </div>

            {intro && <p className="text-muted-foreground leading-relaxed">{intro}</p>}

            {product.desc_items.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {product.desc_items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            )}
            {product.desc_nota && <p className="text-xs text-muted-foreground italic">{product.desc_nota}</p>}

            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              {variantes.length > 1 && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Elige tu opción</span>
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  >
                    {variantes.map((v) => (
                      <option key={v.variante_id} value={v.variante_id}>
                        {v.nombre_variante || v.nombre_display || "Opción"} — {fmt(v.precio)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-border">
                  <button type="button" aria-label="Quitar una pieza" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-primary">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    aria-label="Cantidad"
                    className="w-14 h-10 text-center bg-transparent text-sm font-semibold"
                  />
                  <button type="button" aria-label="Agregar una pieza" onClick={() => setQty((q) => q + 1)} className="w-10 h-10 flex items-center justify-center text-primary">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90"
                >
                  <ShoppingBag className="w-4 h-4" /> Agregar — {fmt((selected?.precio || 0) * qty)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
