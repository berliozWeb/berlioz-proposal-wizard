import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Minus, Plus, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import type { ProductoCotizador, Variante } from "@/hooks/useMenuCotizador";

interface Props {
  product: ProductoCotizador;
  open: boolean;
  onClose: () => void;
}

export default function ProductoDetalleModal({ product, open, onClose }: Props) {
  const { addItem } = useCart();
  const variantes = product.variantes;
  const defaultVariante = variantes.find((v) => v.es_base) ?? variantes[0];
  const [selectedId, setSelectedId] = useState<string>(defaultVariante?.variante_id ?? "");
  const [cantidad, setCantidad] = useState<string>("");
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const selected: Variante | undefined =
    variantes.find((v) => v.variante_id === selectedId) ?? defaultVariante;

  const gallery = useMemo(() => {
    const imgs = [
      selected?.img,
      product.img_principal,
      ...(product.galeria || []),
    ].filter((v): v is string => !!v);
    return Array.from(new Set(imgs));
  }, [product, selected]);

  useEffect(() => {
    if (open) {
      setImgIdx(0);
      setCantidad("");
      setAdded(false);
    }
  }, [open, product.product_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const desc = useMemo(() => {
    if (product.desc_intro || (product.desc_items && product.desc_items.length) || product.desc_nota) {
      return {
        intro: product.desc_intro ?? null,
        items: product.desc_items ?? [],
        nota: product.desc_nota ?? null,
      };
    }
    return parseDescripcionWoo(product.desc_larga || product.desc_corta);
  }, [product]);

  if (!open || !selected) return null;

  const { intro, items, nota } = desc;

  const qty = parseInt(cantidad || "0", 10) || 0;
  const total = (selected.precio || 0) * qty;

  const handleAdd = () => {
    if (qty < 1) return;
    addItem({
      id: selected.variante_id,
      name: selected.nombre_display || product.nombre,
      price: selected.precio || 0,
      quantity: qty,
      image: gallery[0] || undefined,
      category: product.categoria,
      isPerPerson: true,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl border border-border shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Imagen grande */}
          <div className="relative bg-muted">
            <div className="relative aspect-square overflow-hidden">
              <img
                src={gallery[imgIdx] || ""}
                alt={product.nombre}
                className="w-full h-full object-cover"
              />
              {gallery.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <button
                    type="button"
                    onClick={() => setImgIdx((i) => (i === 0 ? gallery.length - 1 : i - 1))}
                    className="h-9 w-9 rounded-full bg-background/85 border border-border flex items-center justify-center"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgIdx((i) => (i === gallery.length - 1 ? 0 : i + 1))}
                    className="h-9 w-9 rounded-full bg-background/85 border border-border flex items-center justify-center"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {gallery.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      "shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all",
                      imgIdx === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalles */}
          <div className="p-6 sm:p-8 flex flex-col">
            {product.categoria && (
              <span className="self-start px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-3">
                {product.categoria}
              </span>
            )}
            <h2 className="font-heading text-2xl sm:text-3xl text-foreground leading-tight mb-3 uppercase">
              {product.nombre}
            </h2>
            <p className="text-lg font-bold text-foreground mb-4">
              ${selected.precio.toLocaleString("es-MX")}
              <span className="text-[11px] font-normal text-muted-foreground ml-1">por pieza</span>
            </p>

            {(intro || items.length > 0 || nota) && (
              <div className="mb-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Detalles
                </h3>
                {intro && (
                  <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    {intro}
                  </p>
                )}
                {items.length > 0 && (
                  <ul className="space-y-1.5 mb-3">
                    {items.map((it, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-snug">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {nota && (
                  <p className="text-[11px] text-muted-foreground/90 leading-snug rounded-lg bg-muted/50 border border-border/50 px-3 py-2">
                    {nota}
                  </p>
                )}
              </div>
            )}

            {variantes.length > 1 && (
              <div className="mb-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Elige tu opción
                </h3>
                <div className="space-y-2">
                  {variantes.map((v) => {
                    const active = v.variante_id === selectedId;
                    return (
                      <button
                        key={v.variante_id}
                        type="button"
                        onClick={() => setSelectedId(v.variante_id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border/60 bg-background hover:border-primary/40",
                        )}
                      >
                        <span className="text-sm truncate">
                          {v.nombre_variante || v.nombre_display || "Opción"}
                        </span>
                        <span className="text-xs font-bold text-primary whitespace-nowrap">
                          ${v.precio.toLocaleString("es-MX")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cantidad + agregar */}
            <div className="mt-auto space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCantidad(String(Math.max(1, qty - 1)))}
                  className="h-11 w-11 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Restar pieza"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  placeholder="Piezas"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value.replace(/[^0-9]/g, ""))}
                  className="h-11 flex-1 min-w-0 rounded-xl border border-border bg-background text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setCantidad(String(qty + 1))}
                  className="h-11 w-11 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Sumar pieza"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={qty < 1}
                className={cn(
                  "w-full h-12 rounded-xl font-body text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                  added
                    ? "bg-green-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" /> ¡En el carrito!
                  </>
                ) : qty > 0 ? (
                  `Agregar ${qty} — $${total.toLocaleString("es-MX")}`
                ) : (
                  "Elige cuántas piezas"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
