import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, ArrowRight, Check, Minus, Plus, ChevronRight } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import {
  useMenuCotizador,
  CATEGORIAS_COTIZADOR,
  productoHasDietary,
  type ProductoCotizador,
  type Variante,
  type DietaryFilter,
} from "@/hooks/useMenuCotizador";
import { useProductos } from "@/hooks/useProductos";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Coffee Break": "☕",
  "Comida": "🍱",
  "Desayuno": "🍳",
  "Bebida": "🥤",
  "Torta Piropo": "🥖",
};
const FAVORITOS_FILTER = { value: "favoritos", label: "Favoritos", emoji: "★" };
const TAG_FILTERS: { value: DietaryFilter; label: string; emoji: string }[] = [
  { value: "vegetariano", label: "Vegetariano", emoji: "🌿" },
  { value: "vegano", label: "Vegano", emoji: "🌱" },
  { value: "keto", label: "Keto", emoji: "🥑" },
  { value: "sin_gluten", label: "Sin Gluten", emoji: "🌾" },
  { value: "sin_lactosa", label: "Sin Lactosa", emoji: "🥛" },
];

/* ── Per-product card with variant selector + guests counter ── */
function ProductoCard({ product }: { product: ProductoCotizador }) {
  const { addItem, isInCart } = useCart();
  const variantes = product.variantes;
  const hasMany = variantes.length > 1;
  const defaultVariante =
    variantes.find((v) => v.es_base) ?? variantes[0];
  const [selectedId, setSelectedId] = useState<string>(defaultVariante?.variante_id ?? "");
  const [invitados, setInvitados] = useState<number>(10);

  const selected: Variante | undefined =
    variantes.find((v) => v.variante_id === selectedId) ?? defaultVariante;

  if (!selected) return null;

  const img = selected.img || product.img_principal || product.img_fallback || "";
  const fallback = product.img_fallback || product.img_principal || "";
  const inCart = isInCart(selected.variante_id);
  const totalPrecio = (selected.precio || 0) * Math.max(1, invitados);

  const handleAdd = () => {
    addItem({
      id: selected.variante_id,
      name: selected.nombre_display || product.nombre,
      price: selected.precio || 0,
      quantity: Math.max(1, invitados),
      image: img || undefined,
      category: product.categoria,
      isPerPerson: true,
    });
  };

  return (
    <div className="group flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={img}
          alt={product.nombre}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            if (fallback && el.src !== fallback) el.src = fallback;
          }}
        />
        {product.categoria && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
            {product.categoria}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-foreground leading-tight mb-1 uppercase tracking-wide">
          {product.nombre}
        </h3>
        {product.desc_mini && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {product.desc_mini}
          </p>
        )}

        {/* Variante selector */}
        {hasMany && (
          <div className="mb-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Elige tu opción
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {variantes.map((v) => (
                <option key={v.variante_id} value={v.variante_id}>
                  {v.nombre_variante || v.nombre_display || "Opción"} — ${v.precio.toLocaleString("es-MX")}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Invitados */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Invitados
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInvitados((n) => Math.max(1, n - 1))}
              className="h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Restar invitado"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              min={1}
              value={invitados}
              onChange={(e) => setInvitados(Math.max(1, parseInt(e.target.value || "1", 10)))}
              className="h-9 w-16 rounded-lg border border-border bg-background text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setInvitados((n) => n + 1)}
              className="h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Sumar invitado"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-muted-foreground ml-1">× ${selected.precio.toLocaleString("es-MX")}</span>
          </div>
        </div>

        {/* Add button */}
        <div className="mt-auto">
          {inCart ? (
            <button
              type="button"
              onClick={handleAdd}
              className="w-full h-11 rounded-xl font-body text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-green-600 text-white hover:bg-green-700"
            >
              <Check className="w-3.5 h-3.5" /> En el carrito — Agregar más
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="w-full h-11 rounded-xl font-body text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Agregar — ${totalPrecio.toLocaleString("es-MX")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const CatalogPage = () => {
  const [searchParams] = useSearchParams();
  const { itemCount } = useCart();
  const { data: productos = [], isLoading: loading, error, refetch } = useMenuCotizador();
  const { productos: catalogProductos } = useProductos({ activo: true, tipo: ['simple', 'variable'] });
  const favoritoIds = useMemo(() => {
    return new Set(catalogProductos.filter((p) => p.destacado).map((p) => p.id));
  }, [catalogProductos]);
  const productosConFavorito = useMemo(() => {
    return productos.map((p) => ({ ...p, isFavorito: favoritoIds.has(p.product_id) }));
  }, [productos, favoritoIds]);

  const [filter, setFilter] = useState(searchParams.get("categoria") || "favoritos");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Category tabs: Favoritos first, then categories, then dietary
  const categoryFilters = useMemo(() => {
    const present = new Set(productos.map((p) => p.categoria));
    const cats = CATEGORIAS_COTIZADOR.filter((c) => present.has(c));
    return [
      FAVORITOS_FILTER,
      ...cats.map((c) => ({ value: c, label: c, emoji: CATEGORY_EMOJIS[c] ?? "🍽️" })),
      ...TAG_FILTERS,
    ];
  }, [productos]);

  const filtered = useMemo(() => {
    let list = productosConFavorito;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.desc_mini?.toLowerCase().includes(q) ||
          p.desc_corta?.toLowerCase().includes(q),
      );
    }
    const dietaryKeys: DietaryFilter[] = ["vegetariano", "vegano", "keto", "sin_gluten", "sin_lactosa"];
    if ((dietaryKeys as string[]).includes(filter)) {
      list = list.filter((p) => productoHasDietary(p, filter as DietaryFilter));
    } else if (filter === "favoritos") {
      list = list.filter((p) => p.isFavorito);
    } else if (filter !== "todos") {
      list = list.filter((p) => p.categoria === filter);
    }
    return list;
  }, [productosConFavorito, filter, search]);

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
                {categoryFilters.map((f) => (
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
              <div className="flex items-center gap-3" />
            </div>
          </div>
        </div>

        <div className="flex gap-10">
          {/* Product Grid */}
          <div className="flex-1">
            {error ? (
              <div className="text-center py-32 rounded-[40px] border border-dashed border-destructive/40 flex flex-col items-center justify-center bg-destructive/5">
                <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                  <ShoppingBag className="w-10 h-10 text-destructive/70" />
                </div>
                <h3 className="font-heading text-2xl text-foreground mb-2">No pudimos cargar el catálogo</h3>
                <p className="font-body text-muted-foreground mb-8 max-w-sm">{(error as Error)?.message ?? "Intenta de nuevo."}</p>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Reintentar
                </button>
              </div>
            ) : loading ? (
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
                  onClick={() => { setFilter("favoritos"); setSearch(""); }}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <ArrowRight className="w-4 h-4" /> Ver favoritos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((product, i) => (
                  <RevealOnScroll key={product.product_id} delay={(i % 3) * 100}>
                    <ProductoCard product={product} />
                  </RevealOnScroll>
                ))}
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

    </BaseLayout>
  );
};

export default CatalogPage;
