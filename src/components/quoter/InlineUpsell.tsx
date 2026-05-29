import { useState, useEffect } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN } from "@/domain/value-objects/Money";
import { cn } from "@/lib/utils";
import type { UpsellRecommendation } from "@/components/quoter/UpsellModal";

interface TierItemLite {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface InlineUpsellProps {
  tierItems: TierItemLite[];
  eventType: string;
  peopleCount: number;
  dietaryCounts?: { tipo: string; cantidad: number }[];
  month?: number;
  selectedIds: string[];
  onSelectionChange: (extras: UpsellRecommendation[]) => void;
}

export default function InlineUpsell({
  tierItems,
  eventType,
  peopleCount,
  dietaryCounts = [],
  month,
  selectedIds,
  onSelectionChange,
}: InlineUpsellProps) {
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<UpsellRecommendation[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
        if (cancelled) return;
        if (error) {
          console.error("upsell error", error);
          setRecs([]);
        } else {
          setRecs((data?.recommendations as UpsellRecommendation[]) ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, peopleCount, month]);

  const toggle = (rec: UpsellRecommendation) => {
    const isAdded = selectedIds.includes(rec.id);
    const next = isAdded
      ? recs.filter((r) => selectedIds.includes(r.id) && r.id !== rec.id)
      : [...recs.filter((r) => selectedIds.includes(r.id)), rec];
    onSelectionChange(next);
  };

  return (
    <div className="mt-6 pt-6 border-t border-[#CEC1B9]/40">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#014D6F]" />
        <p className="font-heading text-[11px] font-bold uppercase tracking-[0.15em] text-[#014D6F]">
          ¿Algo más para tu evento?
        </p>
        <span className="font-body text-[11px] text-[#777] italic">
          Recomendado con IA según tu pedido
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-[#777]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-body text-xs">Generando recomendaciones…</span>
        </div>
      ) : recs.length === 0 ? (
        <p className="font-body text-xs text-[#777] py-2">
          No hay sugerencias disponibles en este momento.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {recs.map((r) => {
            const isAdded = selectedIds.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r)}
                className={cn(
                  "text-left rounded-xl border-2 overflow-hidden transition-all bg-white",
                  isAdded
                    ? "border-[#014D6F] shadow-[0_4px_16px_rgba(1,77,111,0.15)]"
                    : "border-[#CEC1B9]/40 hover:border-[#014D6F]/40",
                )}
              >
                <div className="relative aspect-[4/3] bg-[#F8F4F0]">
                  {r.img && (
                    <img
                      src={r.img}
                      alt={r.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  {isAdded && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#014D6F] flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="font-heading text-[12px] font-semibold text-[#014D6F] leading-tight line-clamp-2">
                    {r.name}
                  </p>
                  <p className="font-body text-[10px] text-[#777] italic line-clamp-2 mt-1">
                    {r.reason}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-mono text-[12px] font-bold text-[#014D6F]">
                      {formatMXN(r.price)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#999]">
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
  );
}