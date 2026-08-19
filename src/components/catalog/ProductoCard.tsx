import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import type { ProductoCotizador, Variante } from "@/hooks/useMenuCotizador";

export default function ProductoCard({ product }: { product: ProductoCotizador }) {
  const { addItem, isInCart } = useCart();
  const variantes = product.variantes;
  const hasMany = variantes.length > 1;
  const defaultVariante = variantes.find((v) => v.es_base) ?? variantes[0];
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
