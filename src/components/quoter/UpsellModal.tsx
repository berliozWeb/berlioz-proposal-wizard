import { useState, useEffect } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN } from "@/domain/value-objects/Money";
import { cn } from "@/lib/utils";

export interface UpsellRecommendation {
  id: string;
  name: string;
  price: number;
  unit: string;
  img: string;
  reason: string;
  tag?: string;
}

interface TierItemLite {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface UpsellModalProps {
  open: boolean;
  tierItems: TierItemLite[];
  eventType: string;
  peopleCount: number;
  dietaryCounts?: { tipo: string; cantidad: number }[];
  month?: number;
  onConfirm: (selected: UpsellRecommendation[]) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function UpsellModal({
  open,
  tierItems,
  eventType,
  peopleCount,
  dietaryCounts = [],
  month,
  onConfirm,
  onSkip,
  onClose,
}: UpsellModalProps) {
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<UpsellRecommendation[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setAdded(new Set());
    supabase.functions
      .invoke("get-upsell-recommendations", {
        body: {
          tierItems,
          eventType,
          peopleCount,
          dietaryCounts,
          month: month ?? new Date().getMonth() + 1,
        },
      })
      .then(({ data, error }) => {
        if (error) {
          console.error("upsell error", error);
          setRecs([]);
        } else {
          setRecs((data?.recommendations as UpsellRecommendation[]) ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const toggle = (id: string) => {
    setAdded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const chosen = recs.filter((r) => added.has(r.id));
    if (chosen.length === 0) onSkip();
    else onConfirm(chosen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b border-[#F2DDD5] flex items-start justify-between">
          <div>
            <h3 className="font-bold text-xl text-[#014D6F]">¿Algo más para tu evento?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Recomendaciones personalizadas con IA para complementar tu pedido
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#014D6F]" />
              <p className="text-sm text-gray-500">Generando recomendaciones…</p>
            </div>
          ) : recs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay recomendaciones disponibles en este momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recs.map((r) => {
                const isAdded = added.has(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggle(r.id)}
                    className={cn(
                      "text-left rounded-2xl border-2 overflow-hidden transition-all",
                      isAdded
                        ? "border-[#014D6F] bg-[#F2DDD5]/40 shadow-md"
                        : "border-gray-200 hover:border-[#014D6F]/40 bg-white",
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <img
                        src={r.img}
                        alt={r.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      {isAdded && (
                        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#014D6F] flex items-center justify-center shadow-md">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-[#014D6F] leading-tight">
                        {r.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">
                        {r.reason}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-gray-900">
                          {formatMXN(r.price)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">
                          {r.unit}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
          >
            No gracias, solo lo que elegí
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-full bg-[#014D6F] text-white font-bold text-sm hover:bg-[#013a55] transition disabled:opacity-50"
          >
            {added.size > 0
              ? `Confirmar con ${added.size} extra${added.size > 1 ? "s" : ""} →`
              : "Continuar sin extras →"}
          </button>
        </div>
      </div>
    </div>
  );
}