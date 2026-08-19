import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import {
  useMenuCatalogo,
  CATEGORIAS_MENU_ORDEN,
  type CategoriaMenu,
} from "@/hooks/useMenuCatalogo";
import {
  type ProductoCotizador,
  type Variante,
} from "@/hooks/useMenuCotizador";
import ProductoCard from "@/components/catalog/ProductoCard";

const CATEGORY_EMOJIS: Record<CategoriaMenu | "favoritos", string> = {
  favoritos: "★",
  "Working Lunch": "🍱",
  Desayuno: "🍳",
  "Coffee Break": "☕",
  Bebidas: "🥤",
  "Tortas Piropo": "🥖",
  "Entrega Especial": "🚚",
  "Vegano / Vegetariano": "🌿",
};

const PAGE_SIZE = 15;

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { itemCount } = useCart();
  const { data, isLoading: loading, error, refetch } = useMenuCatalogo();

  const [filter, setFilter] = useState(
    searchParams.get("categoria") || "favoritos",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1);
    setSearchParams(value === "favoritos" ? {} : { categoria: value }, { replace: true });
  };

  const availableTabs = useMemo(() => {
    const tabs: { value: string; label: string; emoji: string }[] = [
      { value: "favoritos", label: "Favoritos", emoji: CATEGORY_EMOJIS.favoritos },
    ];
    if (!data) return tabs;
    CATEGORIAS_MENU_ORDEN.forEach((cat) => {
      if (data.categoriasPresentes.includes(cat)) {
        tabs.push({ value: cat, label: cat, emoji: CATEGORY_EMOJIS[cat] });
      }
    });
    return tabs;
  }, [data]);

  const effectiveFilter = useMemo(() => {
    if (filter === "favoritos" && data?.favoritos.length === 0) {
      return data?.categoriasPresentes[0] ?? "favoritos";
    }
    return filter;
  }, [filter, data]);

  const filteredList = useMemo(() => {
    if (!data) return [];
    let list =
      effectiveFilter === "favoritos"
        ? data.favoritos
        : data.porCategoria[effectiveFilter as CategoriaMenu] || [];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.desc_mini?.toLowerCase().includes(q) ||
          p.desc_corta?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, effectiveFilter, search]);

  const isPaginated = effectiveFilter !== "favoritos";
  const totalPages = isPaginated ? Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE)) : 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedList = isPaginated
    ? filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : filteredList;

  const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, filteredList.length);

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
            <div className="flex items-center gap-4 pb-1">
              <div className="flex flex-wrap gap-1 bg-muted/30 p-1 rounded-2xl border border-border/50">
                {availableTabs.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleFilterChange(f.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-medium transition-all duration-300 whitespace-nowrap",
                      effectiveFilter === f.value
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
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
            ) : paginatedList.length === 0 ? (
              <div className="text-center py-32 rounded-[40px] border border-dashed border-border flex flex-col items-center justify-center bg-muted/10">
                <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-heading text-2xl text-foreground mb-2">No encontramos resultados</h3>
                <p className="font-body text-muted-foreground mb-8 max-w-sm">Prueba ajustando tus filtros.</p>
                <button
                  onClick={() => { handleFilterChange("favoritos"); setSearch(""); }}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <ArrowRight className="w-4 h-4" /> Ver favoritos
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedList.map((product, i) => (
                    <RevealOnScroll key={product.product_id} delay={(i % 3) * 100}>
                      <ProductoCard product={product} />
                    </RevealOnScroll>
                  ))}
                </div>
                {isPaginated && totalPages > 1 && (
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {startIndex}–{endIndex} de {filteredList.length} productos
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={cn(
                            "h-10 w-10 rounded-xl font-body text-sm font-medium transition-colors",
                            currentPage === p
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-card hover:bg-muted"
                          )}
                          aria-label={`Página ${p}`}
                          aria-current={currentPage === p ? "page" : undefined}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        aria-label="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
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
                  <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
