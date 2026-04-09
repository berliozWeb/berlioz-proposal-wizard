import { useState, useMemo, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

/** Strip HTML tags and decode entities for plain text display */
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
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
import { Search, ShoppingBag, ChevronRight, Filter, ArrowRight, Check } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import CartSidebar from "@/components/ui/CartSidebar";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { useProductos, type Producto } from "@/hooks/useProductos";

const CATEGORY_FILTERS = [
  { value: "favoritos", label: "Favoritos", emoji: "⭐" },
  { value: "todos", label: "Todos", emoji: "🍽️" },
  { value: "Coffee Break", label: "Coffee Break", emoji: "☕" },
  { value: "Working Lunch", label: "Working Lunch", emoji: "🍱" },
  { value: "Desayuno", label: "Desayuno", emoji: "🍳" },
  { value: "Bebidas", label: "Bebidas", emoji: "🥤" },
  { value: "vegano", label: "Vegano/Vegetariano", emoji: "🌱" },
  { value: "keto", label: "Keto", emoji: "🥑" },
  { value: "Tortas Piropo", label: "Tortas Piropo", emoji: "🥖" },
  { value: "Entrega Especial", label: "Entrega Especial", emoji: "🎁" },
];

const SORT_OPTIONS = [
  { value: "orden", label: "Recomendados" },
  { value: "price_asc", label: "Precio: Menor a Mayor" },
  { value: "price_desc", label: "Precio: Mayor a Menor" },
  { value: "name_asc", label: "A → Z" },
];

function getDisplayPrice(p: Producto): number {
  return p.precio ?? p.precio_min ?? p.precio_rebajado ?? 0;
}

const CatalogPage = () => {
  const [searchParams] = useSearchParams();
  const { addItem, itemCount, isInCart } = useCart();
  const { productos, loading } = useProductos({ activo: true, tipo: ['simple', 'variable'] });
  const [filter, setFilter] = useState(searchParams.get("categoria") || "favoritos");
  const [sort, setSort] = useState("orden");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let list = [...productos];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.nombre.toLowerCase().includes(q) || p.descripcion_corta?.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q));
    }
    if (filter === "favoritos") {
      list = list.filter((p) => p.popularity_rank != null);
      list.sort((a, b) => (a.popularity_rank ?? 999) - (b.popularity_rank ?? 999));
    } else if (filter === "vegano") {
      list = list.filter((p) => p.dietary_tags?.some(t => ['vegano', 'vegetariano'].includes(t.toLowerCase())));
    } else if (filter === "keto") {
      list = list.filter((p) => p.dietary_tags?.some(t => t.toLowerCase() === 'keto'));
    } else if (filter !== "todos") {
      list = list.filter((p) => p.categoria === filter);
    }
    if (filter !== "favoritos") {
      if (sort === "price_asc") list.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
      else if (sort === "price_desc") list.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
      else if (sort === "name_asc") list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return list;
  }, [productos, filter, sort, search]);

  return (
    <BaseLayout>
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden -mt-[72px]" style={{ background: '#F2E4D8' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20">
          <RevealOnScroll>
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-4 backdrop-blur-sm">
                Explora el sabor
              </span>
              <h1 className="font-heading text-4xl md:text-6xl text-foreground mb-4 leading-tight tracking-tight">
                Nuestro Menú<br />Gourmet
              </h1>
              <p className="font-body text-base md:text-lg text-muted-foreground/90 max-w-md leading-relaxed">
                Selecciona tus favoritos y arma tu pedido perfecto.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* Filter Bar */}
        <div className="sticky top-[72px] z-40 -mx-6 px-6 py-4 mb-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
              <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50">
                {CATEGORY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-xl font-body text-sm font-medium transition-all duration-300 whitespace-nowrap",
                      filter === f.value
                        ? "bg-card text-primary shadow-sm ring-1 ring-border/20"
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    )}
                  >
                    <span className="text-lg leading-none">{f.emoji}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Busca bágels, ensaladas, postres..."
                  className="h-12 pl-12 pr-6 rounded-2xl border border-border/60 bg-card/50 font-body text-sm w-full md:w-[400px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-card/50 border border-border/60 px-4 h-12 rounded-2xl">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-transparent border-none font-body text-xs text-foreground focus:outline-none cursor-pointer pr-4"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-10">
          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-[32px] border border-border bg-card animate-pulse overflow-hidden">
                    <div className="aspect-square bg-muted" />
                    <div className="p-6 space-y-4">
                      <div className="h-5 bg-muted rounded-full w-3/4" />
                      <div className="h-4 bg-muted rounded-full w-1/2" />
                      <div className="h-12 bg-muted rounded-2xl w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-32 rounded-[40px] border border-dashed border-border flex flex-col items-center justify-center bg-muted/10">
                <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-heading text-2xl text-foreground mb-2">No encontramos resultados</h3>
                <p className="font-body text-muted-foreground mb-8 max-w-sm">Prueba ajustando tus filtros.</p>
                <button
                  onClick={() => { setFilter("todos"); setSearch(""); }}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <ArrowRight className="w-4 h-4" /> Ver todo el catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((product, i) => {
                  const price = getDisplayPrice(product);
                  const inCart = isInCart(product.id);
                  const imgSrc = product.imagen_url || `https://ktyupdpzgmzzfkskkvpn.supabase.co/storage/v1/object/public/Berlioz-images/${product.imagen}`;

                  return (
                    <RevealOnScroll key={product.id} delay={i % 3 * 100}>
                      <div className="group relative flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        {/* Image */}
                        <Link to={`/producto/${product.id}`} className="relative aspect-square overflow-hidden bg-muted block">
                          <img
                            src={imgSrc}
                            alt={product.nombre}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          {/* Category badge */}
                          {product.categoria && (
                            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                              {product.categoria}
                            </span>
                          )}
                          {product.destacado && (
                            <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg">
                              Destacado
                            </span>
                          )}
                        </Link>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                          <Link to={`/producto/${product.id}`}>
                            <h3 className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors mb-1">
                              {toTitleCase(product.nombre)}
                            </h3>
                          </Link>
                          {(product.descripcion_corta || product.descripcion) && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{(product.descripcion_corta || stripHtml(product.descripcion || '')).replace(/\s+/g, ' ').trim()}</p>
                          )}

                          <div className="mt-auto flex items-center justify-between">
                            <div>
                              {product.precio_rebajado && product.precio && product.precio_rebajado < product.precio ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-lg font-bold" style={{ color: '#2D6A4F' }}>${product.precio_rebajado}</span>
                                  <span className="text-sm text-muted-foreground line-through">${product.precio}</span>
                                </div>
                              ) : price > 0 ? (
                                <span className="text-lg font-bold" style={{ color: '#2D6A4F' }}>${price.toLocaleString("es-MX")}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">Precio variable</span>
                              )}
                            </div>

                            {inCart ? (
                              <Link
                                to="/carrito"
                                className="h-10 px-4 rounded-xl font-body text-xs font-semibold flex items-center gap-1.5 transition-all bg-green-600 text-white hover:bg-green-700"
                              >
                                <Check className="w-3.5 h-3.5" /> En el carrito
                              </Link>
                            ) : (
                              <button
                                onClick={() => {
                                  addItem({
                                    id: product.id,
                                    name: product.nombre,
                                    price,
                                    image: product.imagen_url || undefined,
                                    category: product.categoria || undefined,
                                    isPerPerson: true,
                                  });
                                }}
                                className="h-10 px-4 rounded-xl font-body text-xs font-semibold flex items-center gap-1.5 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Añadir al carrito
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </RevealOnScroll>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Cart Summary */}
          {itemCount > 0 && (
            <div className="hidden xl:block w-[320px] shrink-0">
              <div className="sticky top-[240px] bg-card/60 backdrop-blur-xl rounded-[32px] border border-border/80 p-8 shadow-2xl shadow-black/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-heading text-xl text-foreground">Tu carrito</h3>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-primary">{itemCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/carrito")}
                  className="group w-full h-14 rounded-2xl bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  Ver carrito
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <button
          onClick={() => navigate("/carrito")}
          className="xl:hidden fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-500"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center shadow-md">
              {itemCount}
            </span>
          </div>
          <span className="font-body text-sm font-bold uppercase tracking-wider">Ver Carrito</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </BaseLayout>
  );
};

export default CatalogPage;
