import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import BaseLayout from "@/components/layout/BaseLayout";
import CartSidebar from "@/components/ui/CartSidebar";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  { value: "todos", label: "Todos" },
  { value: "desayuno", label: "Desayuno de trabajo" },
  { value: "coffee_am", label: "Coffee Break AM" },
  { value: "coffee_pm", label: "Coffee Break PM" },
  { value: "working_lunch", label: "Working Lunch" },
  { value: "vegano", label: "Vegano / Sin gluten" },
  { value: "bestseller", label: "⭐ Más pedidos" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Más pedidos" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-4xl text-foreground">Nuestro menú</h1>
          <p className="font-body text-muted-foreground mt-2">Selecciona por tipo de ocasión o explora todo el catálogo.</p>
        </div>

        {/* Filter bar */}
        <div className="sticky top-[72px] z-40 bg-card/95 backdrop-blur-md border-b border-border -mx-6 px-6 py-3 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full font-body text-xs font-medium transition-all whitespace-nowrap",
                    filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="h-9 pl-9 pr-3 rounded-lg border border-input bg-card font-body text-sm w-44 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 px-3 rounded-lg border border-input bg-card font-body text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                    <div className="aspect-square bg-muted rounded-t-xl" />
                    <div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div>
                  </div>
                ))}
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <ShoppingBag className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-body text-muted-foreground mb-4">No hay productos para este filtro</p>
                <button onClick={() => { setFilter("todos"); setSearch(""); }} className="font-body text-sm text-primary hover:underline">Ver todos</button>
              </div>
            )}
            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((product) => (
                  <CatalogProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => {
                      addItem({ id: product.id, name: product.name, price: product.price_per_person, image: product.image_url || undefined, isPerPerson: true, quantity: 10 });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {itemCount > 0 && (
            <div className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[140px] bg-card rounded-xl border border-border p-5">
                <h3 className="font-body font-semibold text-foreground text-sm mb-2">Tu pedido</h3>
                <p className="font-body text-muted-foreground text-xs mb-4">{itemCount} productos</p>
                <button onClick={() => setCartOpen(true)} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors">Ver carrito →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {itemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{itemCount}</span>
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
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-10 h-10 text-muted-foreground/30" /></div>
        )}
        {product.is_bestseller && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-body text-[10px] font-semibold uppercase tracking-wide">Más pedido</span>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-body text-sm font-semibold text-foreground leading-tight">{product.name}</h3>
          {product.short_description && <p className="font-body text-xs text-muted-foreground mt-0.5">{product.short_description}</p>}
        </div>
        <div>
          <span className="font-body text-lg font-bold text-secondary">${product.price_per_person}</span>
          <span className="font-body text-xs text-muted-foreground ml-1">/ persona</span>
          <p className="font-body text-[11px] text-muted-foreground">para 10 personas: ${(product.price_per_person * 10).toLocaleString("es-MX")}</p>
        </div>
        {product.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.dietary_tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-blue-light font-body text-[10px] text-secondary font-medium capitalize">{tag.replace("_", " ")}</span>
            ))}
          </div>
        )}
        {/* Inline date/slot */}
        <div className="border-t border-border pt-3">
          <p className="font-body text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Fecha</p>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {days.map((d) => {
              const iso = format(d, "yyyy-MM-dd");
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <button key={iso} disabled={isWeekend} onClick={() => setSelectedDate(iso)}
                  className={cn("flex flex-col items-center px-2 py-1 rounded text-[10px] font-body shrink-0 transition-all",
                    selectedDate === iso ? "bg-primary text-primary-foreground" : isWeekend ? "bg-muted text-muted-foreground/40 cursor-not-allowed" : "bg-muted text-foreground hover:bg-primary/10"
                  )}>
                  <span className="font-medium">{format(d, "EEE", { locale: es })}</span>
                  <span>{format(d, "d")}</span>
                </button>
              );
            })}
          </div>
          <p className="font-body text-[10px] text-muted-foreground mb-1.5 mt-2 uppercase tracking-wider">Horario</p>
          <div className="flex gap-1">
            {TIME_SLOTS.map((t) => (
              <button key={t} onClick={() => setSelectedSlot(t)}
                className={cn("flex-1 py-1 rounded font-mono text-[10px] transition-all",
                  selectedSlot === t ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-primary/10"
                )}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleAdd} disabled={!selectedDate || !selectedSlot}
          className={cn("w-full py-2.5 rounded-lg font-body text-xs font-semibold transition-all",
            added ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          )}>
          {added ? "✓ ¡Agregado!" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

export default CatalogPage;
