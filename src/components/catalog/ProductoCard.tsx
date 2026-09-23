import { useState } from "react";
import { Check, Minus, Plus, Maximize2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import ProductoDetalleModal from "@/components/catalog/ProductoDetalleModal";
import { cn } from "@/lib/utils";
import type { ProductoCotizador, Variante } from "@/hooks/useMenuCotizador";

export default function ProductoCard({ product }: { product: ProductoCotizador }) {
  const { addItem, isInCart } = useCart();
  const variantes = product.variantes;
  const hasMany = variantes.length > 1;
  const defaultVariante = variantes.find((v) => v.es_base) ?? variantes[0];
  const [selectedId, setSelectedId] = useState<string>(defaultVariante?.variante_id ?? "");
  const [picking, setPicking] = useState(false);
  const [cantidad, setCantidad] = useState<string>("");
  const [detalleOpen, setDetalleOpen] = useState(false);

  const selected: Variante | undefined =
    variantes.find((v) => v.variante_id === selectedId) ?? defaultVariante;

  if (!selected) return null;

  const img = selected.img || product.img_principal || product.img_fallback || "";
  const fallback = product.img_fallback || product.img_principal || "";
  const inCart = isInCart(selected.variante_id);
  const qty = parseInt(cantidad || "0", 10) || 0;
  const totalPrecio = (selected.precio || 0) * qty;

  const handleAdd = () => {
    if (qty < 1) return;
    addItem({
      id: selected.variante_id,
      name: selected.nombre_display || product.nombre,
      price: selected.precio || 0,
      quantity: qty,
      image: img || undefined,
      category: product.categoria,
      isPerPerson: true,
    });
    setPicking(false);
    setCantidad("");
  };

  const variantLabel =
    selected.nombre_variante || selected.nombre_display || "Opción";

  return (
    <div className="group flex flex-row sm:flex-col bg-card rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/30">
      {/* Imagen */}
      <button
        type="button"
        onClick={() => setDetalleOpen(true)}
        aria-label={`Ver detalles de ${product.nombre}`}
        className="relative w-[36%] sm:w-full aspect-[4/3] overflow-hidden bg-muted shrink-0 text-left"
      >
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
        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-full bg-background/95 text-foreground text-[9px] font-bold uppercase tracking-wider">
            <Maximize2 className="w-2.5 h-2.5" /> Ver
          </span>
        </span>
      </button>

      {/* Contenido */}
      <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4 justify-between">
        <div className="min-w-0">
          {product.categoria && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">
              {product.categoria}
            </span>
          )}
          <h3
            onClick={() => setDetalleOpen(true)}
            className="text-sm font-bold text-foreground uppercase tracking-wide leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2"
          >
            {product.nombre}
          </h3>
          <p className="text-base font-bold text-foreground mt-0.5">
            ${selected.precio.toLocaleString("es-MX")}
            <span className="text-[10px] font-normal text-muted-foreground ml-1">por pieza</span>
          </p>
        </div>

        {/* Selector compacto de variante */}
        {hasMany && (
          <div className="mt-2">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-8 px-2.5 pr-7 rounded-lg border border-border/70 bg-background text-[11px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {variantes.map((v) => (
                <option key={v.variante_id} value={v.variante_id}>
                  {v.nombre_variante || v.nombre_display || "Opción"} — ${v.precio.toLocaleString("es-MX")}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Agregar / stepper */}
        <div className="mt-2.5">
          {!picking ? (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className={cn(
                "w-full h-9 rounded-xl font-body text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all",
                inCart
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {inCart ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Agregar más
                </>
              ) : (
                "Agregar"
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCantidad(String(Math.max(1, qty - 1)))}
                className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                aria-label="Restar pieza"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min={1}
                autoFocus
                placeholder="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-8 flex-1 min-w-0 rounded-lg border border-border bg-background text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setCantidad(String(qty + 1))}
                className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                aria-label="Sumar pieza"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={qty < 1}
                className="h-8 px-3 rounded-lg font-body text-[11px] font-semibold flex items-center justify-center transition-all bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {qty > 0 ? `$${totalPrecio.toLocaleString("es-MX")}` : "OK"}
              </button>
            </div>
          )}
        </div>
      </div>

      <ProductoDetalleModal
        product={product}
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
      />
    </div>
  );
}
