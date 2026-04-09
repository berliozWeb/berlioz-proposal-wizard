import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  ShoppingBag, 
  CheckCircle2, 
  Users, 
  Star,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import CartSidebar from "@/components/ui/CartSidebar";
import { getMenuItemBySlug, getDisplayPrice } from "@/domain/entities/MenuCatalog";
import { getProductGallery, FALLBACK_IMAGE } from "@/domain/entities/ProductImages";
import type { MenuItem } from "@/domain/entities/MenuItem";

/* ── types ── */
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price_per_person: number;
  image_url: string | null;
  occasion: string[];
  dietary_tags: string[];
  included_items: string[];
  is_bestseller: boolean;
}

interface AiSuggestion {
  productName: string;
  reason: string;
  urgencyMessage: string;
}

/** Strip HTML tags and decode entities for plain text display */
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html.replace(/\\n/g, '\n'), 'text/html');
  return doc.body.textContent || '';
}

/** Normalize product name to Title Case */
function toTitleCase(str: string): string {
  const MINOR = new Set(['de', 'del', 'con', 'y', 'a', 'la', 'el', 'en', 'al', 'por', 'para', 'e', 'o', 'u']);
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i === 0 || !MINOR.has(w) || w.length <= 1) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ');
}

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, itemCount } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [localItem, setLocalItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(10);
  const [added, setAdded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Gallery state
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // AI Suggestions
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      
      const local = getMenuItemBySlug(slug || "");
      if (local) {
        setLocalItem(local);
        setProduct({
          id: local.id,
          name: local.name,
          slug: local.id,
          description: local.description,
          short_description: local.description,
          price_per_person: local.pricePerPerson,
          image_url: local.image || null,
          occasion: [local.category],
          dietary_tags: local.category === 'bebidas' ? [] : ['gourmet'],
          included_items: local.description.split(", "),
          is_bestseller: !!local.isTopSeller,
        });
      } else {
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .eq("id", slug)
          .maybeSingle();
        
        if (!error && data) {
          const imgUrl = data.imagen_url || (data.imagen ? `https://ktyupdpzgmzzfkskkvpn.supabase.co/storage/v1/object/public/Berlioz-images/${data.imagen}` : null);
          setProduct({
            id: data.id,
            name: data.nombre,
            slug: data.id,
            description: data.descripcion,
            short_description: data.descripcion,
            price_per_person: data.precio ?? data.precio_min ?? 0,
            image_url: imgUrl,
            occasion: data.categoria ? [data.categoria] : [],
            dietary_tags: [],
            included_items: stripHtml(data.descripcion ?? '').split(/\n+/).filter((l: string) => l.trim().length > 3),
            is_bestseller: data.destacado ?? false,
          });
        }
      }
      
      setLoading(false);
      setActiveImageIdx(0);
    })();
    window.scrollTo(0, 0);
  }, [slug]);

  // Fetch AI suggestions when product loads
  useEffect(() => {
    if (!product) return;
    setLoadingSuggestions(true);
    supabase.functions.invoke('cart-recommendations', {
      body: {
        cartItems: [{ name: product.name, category: product.occasion?.[0] || '', price: product.price_per_person, qty: 1 }],
        cartTotal: product.price_per_person * 10,
      },
    }).then(({ data }) => {
      if (data?.recommendations) setSuggestions(data.recommendations);
    }).catch(() => {}).finally(() => setLoadingSuggestions(false));
  }, [product?.id]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const localGallery = getProductGallery(slug || "");
    const isFallback = localGallery.length === 1 && localGallery[0] === FALLBACK_IMAGE;
    if (isFallback && product.image_url) return [product.image_url];
    return localGallery;
  }, [product, slug]);

  const handleAdd = () => {
    if (!product) return;
    
    const price = localItem 
      ? getDisplayPrice(localItem, quantity)
      : product.price_per_person;

    addItem({ 
      id: product.id, 
      name: product.name, 
      price: price, 
      image: product.image_url || undefined, 
      isPerPerson: true, 
      quantity 
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <BaseLayout>
        <div className="max-w-7xl mx-auto px-6 py-20 animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="aspect-square bg-muted rounded-[40px]" />
            <div className="space-y-6">
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-24 bg-muted rounded w-full" />
              <div className="h-40 bg-muted rounded w-full" />
            </div>
          </div>
        </div>
      </BaseLayout>
    );
  }

  if (!product) {
    return (
      <BaseLayout>
        <div className="max-w-7xl mx-auto px-6 py-40 text-center">
          <h2 className="font-heading text-3xl mb-4">Producto no encontrado</h2>
          <Link to="/menu" className="text-primary hover:underline font-body">Volver al catálogo</Link>
        </div>
      </BaseLayout>
    );
  }

  const finalPrice = localItem ? getDisplayPrice(localItem, quantity) : product.price_per_person;
  const cleanDescription = stripHtml(product.description || product.short_description || '');
  const shortDescription = product.short_description ? stripHtml(product.short_description) : (cleanDescription.length > 200 ? cleanDescription.slice(0, 200) + '…' : cleanDescription);

  return (
    <BaseLayout>
      <div className="relative pt-8 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Back */}
          <button 
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-primary transition-colors font-body text-sm font-medium"
          >
            <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            Volver
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
            {/* ═══ Left: Product Visuals ═══ */}
            <div className="space-y-6">
              <RevealOnScroll>
                <div className="relative aspect-square rounded-[40px] overflow-hidden bg-muted group shadow-2xl shadow-black/5 border border-border/50">
                  <img 
                    src={gallery[activeImageIdx] || product.image_url || ""} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-3">
                    {product.is_bestseller && (
                      <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground backdrop-blur-md font-body text-[10px] font-bold uppercase tracking-[0.2em] border border-white/20 shadow-lg">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        Más pedido
                      </span>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  {gallery.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setActiveImageIdx(prev => (prev === 0 ? gallery.length - 1 : prev - 1))}
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-primary"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setActiveImageIdx(prev => (prev === gallery.length - 1 ? 0 : prev + 1))}
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-primary"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </RevealOnScroll>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={cn(
                        "relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all",
                        activeImageIdx === idx ? "border-primary scale-95 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Detalles — Full Description */}
              <div className="hidden lg:block pt-4">
                <div className="bg-card/40 backdrop-blur-sm rounded-[32px] border border-border/50 p-8">
                  <h3 className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-6">
                    Detalles
                  </h3>
                  <div className="space-y-4 font-body text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {cleanDescription}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Right: Product Info & Order Controls ═══ */}
            <div className="flex flex-col h-full">
              <RevealOnScroll delay={200}>
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm border border-primary/10">
                        {product.occasion?.[0] || localItem?.category || "Catering"}
                      </span>
                    </div>
                    <h1 className="font-heading text-4xl md:text-6xl text-foreground mb-4 leading-[1.1] tracking-tight">
                      {toTitleCase(product.name)}
                    </h1>
                    <p className="font-body text-lg text-muted-foreground max-w-xl leading-relaxed">
                      {cleanDescription.length > 200 ? cleanDescription.slice(0, 200) + '…' : cleanDescription}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2 py-6 border-y border-border/30">
                    <span className="font-heading text-5xl font-bold text-foreground">
                      ${finalPrice.toLocaleString("es-MX")}
                    </span>
                    <span className="font-body text-sm text-muted-foreground uppercase font-bold tracking-widest opacity-60">
                      / Persona
                    </span>
                    <div className="ml-auto flex items-center gap-2 text-primary font-body text-[10px] font-bold uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Disponible
                    </div>
                  </div>

                  {/* Controls Card — Only Quantity + Add to Cart */}
                  <div className="space-y-6 pt-4">
                    <div className="bg-card/40 rounded-[32px] border border-border/50 p-6 sm:p-8 space-y-8 shadow-sm">
                      {/* Quantity Selector */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-4 h-4 text-primary" />
                          <h3 className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Cantidad de personas
                          </h3>
                        </div>
                        <div className="flex items-center bg-background rounded-3xl border border-border/30 p-1.5 h-16">
                          <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-muted transition-colors text-primary"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="flex-1 flex items-baseline justify-center gap-2">
                             <span className="font-heading text-3xl font-bold">{quantity}</span>
                             <span className="font-body text-[10px] font-bold text-muted-foreground uppercase tracking-widest">invitados</span>
                          </div>
                          <button 
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-muted transition-colors text-primary"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={handleAdd}
                        className={cn(
                          "w-full h-16 rounded-[24px] font-body text-[13px] font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden",
                          added 
                            ? "bg-green-600 text-white shadow-green-600/20" 
                            : "bg-primary text-primary-foreground shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98]"
                        )}
                      >
                         {added ? (
                            <span className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                              <CheckCircle2 className="w-5 h-5" />
                              ¡En el carrito!
                            </span>
                          ) : (
                            <span className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                              <ShoppingBag className="w-5 h-5" />
                              Agregar — ${(finalPrice * quantity).toLocaleString()}
                            </span>
                          )}
                      </button>
                    </div>
                  </div>

                  {/* ═══ AI Suggestions ═══ */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Sugerencias para ti
                      </h3>
                    </div>
                    {loadingSuggestions ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-body text-xs">Generando sugerencias…</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="space-y-3">
                        {suggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-sm font-semibold text-foreground">{s.productName}</p>
                              <p className="font-body text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                              {s.urgencyMessage && (
                                <p className="font-body text-[10px] text-primary font-bold mt-1 uppercase tracking-wider">{s.urgencyMessage}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* ═══ Mobile: Detalles + Suggestions ═══ */}
          <div className="mt-16 lg:hidden space-y-8">
            <div className="bg-card/40 backdrop-blur-sm rounded-[32px] border border-border/50 p-8">
              <h3 className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-6">Detalles</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {cleanDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </BaseLayout>
  );
};

export default ProductDetailPage;
