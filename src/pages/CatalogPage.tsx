import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ShoppingBag, ChevronRight, Clock, Star, Filter, Heart, ArrowRight, Utensils, CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import BaseLayout from "@/components/layout/BaseLayout";
import CartSidebar from "@/components/ui/CartSidebar";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getProductImage } from "@/domain/entities/ProductImages";
import menuHero from "@/assets/menuHero.JPG";

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

/* ── constants ── */
const FILTERS = [
  { value: "todos", label: "Todos", emoji: "🍽️" },
  { value: "desayuno", label: "Desayuno", emoji: "🍳" },
  { value: "coffee_am", label: "Coffee AM", emoji: "☕" },
  { value: "coffee_pm", label: "Coffee PM", emoji: "🍪" },
  { value: "working_lunch", label: "Lunch", emoji: "🍱" },
  { value: "junta", label: "Juntas", emoji: "💼" },
  { value: "vegano", label: "Vegano", emoji: "🌱" },
  { value: "bestseller", label: "Favoritos", emoji: "⭐" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Más pedidos" },
  { value: "price_asc", label: "Precio: Menor a Mayor" },
  { value: "price_desc", label: "Precio: Mayor a Menor" },
];

const TIME_SLOTS = ["7:30", "10:00", "12:00", "15:00"];

function getNext7Days() {
  const days: Date[] = [];
  for (let i = 1; i <= 7; i++) days.push(addDays(new Date(), i));
  return days;
}

/* ── page ── */
const CatalogPage = () => {
  const [searchParams] = useSearchParams();
  const { addItem, itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("occasion") || "todos");
  const [sort, setSort] = useState("popular");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });
      setProducts((data as Product[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (filter === "bestseller") list = list.filter((p) => p.is_bestseller);
    else if (filter === "vegano") list = list.filter((p) => p.dietary_tags.some((t) => ["vegano", "sin_gluten"].includes(t)) || p.occasion.includes("vegano"));
    else if (filter !== "todos") list = list.filter((p) => p.occasion.includes(filter));
    
    if (sort === "price_asc") list.sort((a, b) => a.price_per_person - b.price_per_person);
    else if (sort === "price_desc") list.sort((a, b) => b.price_per_person - a.price_per_person);
    return list;
  }, [products, filter, sort, search]);

  return (
    <BaseLayout>
      {/* ═══ HERO SECTION ═══ */}
      <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center overflow-hidden -mt-[72px]">
        <img src={menuHero} alt="Catalogo Berlioz" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20">
          <RevealOnScroll>
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-4 backdrop-blur-sm">
                Explora el sabor
              </span>
              <h1 className="font-heading text-4xl md:text-6xl text-foreground mb-4 leading-tight tracking-tight">
                Nuestro Menú <br /> Gourmet
              </h1>
              <p className="font-body text-base md:text-lg text-muted-foreground/90 max-w-md leading-relaxed">
                Selecciona la ocasión ideal y personaliza tu pedido para tu equipo u oficina.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* ═══ STICKY FILTER BAR ═══ */}
        <div className="sticky top-[72px] z-40 -mx-6 px-6 py-4 mb-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex flex-col gap-6">
            {/* Main Category Filters */}
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
              <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50">
                {FILTERS.map((f) => (
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

            {/* Search and Sort Sub-bar */}
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
          {/* ═══ PRODUCT GRID ═══ */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-[32px] border border-border bg-card animate-pulse overflow-hidden">
                    <div className="aspect-[4/5] bg-muted" />
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
                <p className="font-body text-muted-foreground mb-8 max-w-sm">Prueba ajustando tus filtros o buscando algo más específico.</p>
                <button 
                  onClick={() => { setFilter("todos"); setSearch(""); }} 
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <ArrowRight className="w-4 h-4" />
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((product, i) => (
                  <RevealOnScroll key={product.id} delay={i % 3 * 100}>
                    <CatalogProductCard
                      product={product}
                      onAdd={() => {
                        addItem({ 
                          id: product.id, 
                          name: product.name, 
                          price: product.price_per_person, 
                          image: product.image_url || undefined, 
                          isPerPerson: true, 
                          quantity: 10 
                        });
                      }}
                    />
                  </RevealOnScroll>
                ))}
              </div>
            )}
          </div>

          {/* ═══ DESKTOP CART SUMMARY ═══ */}
          {itemCount > 0 && (
            <div className="hidden xl:block w-[320px] shrink-0">
              <div className="sticky top-[240px] bg-card/60 backdrop-blur-xl rounded-[32px] border border-border/80 p-8 shadow-2xl shadow-black/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-heading text-xl text-foreground">Tu pedido</h3>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-primary">{itemCount}</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between font-body text-sm text-muted-foreground">
                    <span>Artículos</span>
                    <span className="font-medium text-foreground">{itemCount}</span>
                  </div>
                  <div className="h-px bg-border/50" />
                </div>

                <button 
                  onClick={() => setCartOpen(true)} 
                  className="group w-full h-14 rounded-2xl bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  Continuar pedido
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <p className="text-center font-body text-[10px] text-muted-foreground mt-4 opacity-50 uppercase tracking-widest font-bold">
                  Entrega garantizada
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button for Mobile/Tablet */}
      {itemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
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

/* ── Product Card with inline date/slot ── */
function CatalogProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const days = useMemo(getNext7Days, []);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group relative flex flex-col h-full bg-card rounded-[32px] border border-border/80 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
      {/* Image Area */}
      <Link to={`/producto/${product.slug}`} className="relative aspect-[1/1] overflow-hidden bg-muted block">
        <img 
          src={getProductImage(product.slug)} 
          alt={product.name} 
          loading="lazy" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.is_bestseller && (
            <span className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-body text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-lg border border-white/20">
              Más pedido
            </span>
          )}
          {product.dietary_tags.includes("vegano") && (
            <span className="px-3 py-1.5 rounded-full bg-green-500 text-white font-body text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-lg border border-white/20">
              Plant based
            </span>
          )}
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <Link to={`/producto/${product.slug}`}>
            <h3 className="font-heading text-lg text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
          </Link>
          {product.short_description && (
            <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {product.short_description}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-baseline gap-1.5 mb-6">
          <span className="font-heading text-2xl font-bold text-foreground">
            ${product.price_per_person}
          </span>
          <span className="font-body text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            / persona
          </span>
        </div>

        {/* Customization Options */}
        <div className="space-y-4 mb-8 pt-4 border-t border-border/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Programar entrega
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
              {days.map((d) => {
                const iso = format(d, "yyyy-MM-dd");
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <button 
                    key={iso} 
                    disabled={isWeekend} 
                    onClick={() => setSelectedDate(iso)}
                    className={cn(
                      "flex flex-col items-center min-w-[48px] px-2 py-2 rounded-xl text-[10px] font-body transition-all duration-300 border",
                      selectedDate === iso 
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                        : isWeekend 
                          ? "bg-muted/30 border-transparent text-muted-foreground/30 cursor-not-allowed" 
                          : "bg-muted/50 border-border/40 text-foreground hover:bg-card hover:border-border"
                    )}
                  >
                    <span className="font-bold opacity-60">{format(d, "EEE", { locale: es })}</span>
                    <span className={cn("text-sm", selectedDate === iso ? "font-black" : "font-semibold")}>
                      {format(d, "d")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Horario
              </p>
            </div>
            <div className="flex gap-2">
              {TIME_SLOTS.map((t) => (
                <button 
                  key={t} 
                  onClick={() => setSelectedSlot(t)}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-mono text-[10px] font-bold transition-all duration-300 border",
                    selectedSlot === t 
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "bg-muted/50 border-border/40 text-muted-foreground hover:bg-card hover:text-foreground hover:border-border"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add Button */}
        <button 
          onClick={handleAdd} 
          disabled={!selectedDate || !selectedSlot}
          className={cn(
            "group w-full py-4 rounded-2xl font-body text-xs font-bold uppercase tracking-widest transition-all duration-500",
            added 
              ? "bg-green-500 text-white shadow-lg shadow-green-500/30" 
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
          )}
        >
          {added ? (
            <span className="flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
              ✓ ¡En el carrito!
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Agregar al pedido
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
        
        {!selectedDate && !selectedSlot && (
          <p className="font-body text-[9px] text-center text-muted-foreground mt-3 opacity-60">
            Selecciona fecha y hora para agregar
          </p>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;
