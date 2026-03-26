import { useState, useEffect } from "react";
import { Star, Gift, Copy, MessageCircle, ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN } from "@/domain/value-objects/Money";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIERS = [
  { name: "Bronce", min: 0, max: 500 },
  { name: "Plata", min: 501, max: 1500 },
  { name: "Oro", min: 1501, max: Infinity },
];

const REWARDS = [
  { emoji: "✈️", name: "Vuelo nacional", cost: 2000 },
  { emoji: "💆", name: "Masaje de cortesía", cost: 800 },
  { emoji: "💐", name: "Arreglo floral", cost: 400 },
];

const RewardsPage = () => {
  const { user, profile } = useAuth();
  const loyaltyPoints = (profile as any)?.loyalty_points ?? 0;
  const referralCode = (profile as any)?.referral_code ?? "";
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);

  const tier = TIERS.find((t) => loyaltyPoints >= t.min && loyaltyPoints <= t.max) ?? TIERS[0];
  const nextTier = TIERS.find((t) => t.min > loyaltyPoints);
  const ptsToNext = nextTier ? nextTier.min - loyaltyPoints : 0;
  const progress = nextTier ? ((loyaltyPoints - tier.min) / (nextTier.min - tier.min)) * 100 : 100;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("order_number, points_earned, created_at, total")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setPointsHistory(data ?? []));
  }, [user]);

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://berlioz.mx/r/${referralCode}`);
    toast.success("Enlace copiado");
  };

  const shareReferral = () => {
    const text = encodeURIComponent(`¡Prueba Berlioz para tu catering corporativo! Usa mi código: ${referralCode} y ambos ganamos 200 puntos 🍱 https://berlioz.mx/r/${referralCode}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-8 h-8 text-primary fill-primary" />
          </div>
          <p className="font-heading text-5xl sm:text-6xl text-primary mb-2">{loyaltyPoints}</p>
          <p className="font-body text-lg text-muted-foreground">puntos Berlioz</p>
          <span className={cn(
            "inline-block mt-3 px-4 py-1.5 rounded-full font-body text-sm font-semibold",
            tier.name === "Oro" ? "bg-yellow-100 text-yellow-700" :
            tier.name === "Plata" ? "bg-gray-100 text-gray-600" :
            "bg-amber-50 text-amber-700"
          )}>
            {tier.name}
          </span>
          {nextTier && (
            <div className="max-w-xs mx-auto mt-4">
              <div className="w-full bg-muted rounded-full h-2 mb-1">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="font-body text-xs text-muted-foreground">
                {ptsToNext} puntos para {nextTier.name}
              </p>
            </div>
          )}
        </div>

        {/* How to earn */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 font-body text-sm text-secondary hover:underline">
            ¿Cómo gano puntos? <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 rounded-xl border border-border bg-card p-4 font-body text-sm text-muted-foreground space-y-1">
            <p>• $50 MXN en pedidos = 1 punto</p>
            <p>• Pedidos frecuentes = puntos bonus</p>
            <p>• Referidos = 200 puntos por referido</p>
          </CollapsibleContent>
        </Collapsible>

        {/* Rewards catalog */}
        <div>
          <h2 className="font-heading text-xl text-foreground mb-4">Canjea tus puntos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REWARDS.map((reward) => {
              const canRedeem = loyaltyPoints >= reward.cost;
              return (
                <div key={reward.name} className="rounded-xl border border-border bg-card p-5 text-center">
                  <span className="text-4xl">{reward.emoji}</span>
                  <p className="font-heading text-base mt-3">{reward.name}</p>
                  <p className="font-body text-sm text-primary font-semibold mt-1">{reward.cost.toLocaleString()} puntos</p>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    disabled={!canRedeem}
                    variant={canRedeem ? "default" : "outline"}
                  >
                    {canRedeem ? "Canjear" : `Faltan ${(reward.cost - loyaltyPoints).toLocaleString()} pts`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Points history */}
        <div>
          <h2 className="font-heading text-xl text-foreground mb-4">Historial de puntos</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            {pointsHistory.length === 0 ? (
              <div className="p-8 text-center font-body text-muted-foreground">Sin historial de puntos aún</div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="font-body text-xs text-muted-foreground">
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Concepto</th>
                    <th className="text-right p-3">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsHistory.map((entry, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-3 font-body text-sm">{new Date(entry.created_at).toLocaleDateString("es-MX")}</td>
                      <td className="p-3 font-body text-sm">Pedido #{entry.order_number}</td>
                      <td className="p-3 font-body text-sm text-right text-success font-medium">+{entry.points_earned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Referral */}
        <div className="rounded-xl border border-border bg-blue-light p-6">
          <h2 className="font-heading text-lg text-foreground mb-2">Recomienda Berlioz y gana puntos</h2>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Ganarás 200 puntos cuando tu referido haga su primer pedido.
          </p>
          <div className="flex gap-2 items-center bg-card rounded-lg border border-border px-4 py-2.5 mb-3">
            <code className="font-mono text-sm text-foreground flex-1 truncate">berlioz.mx/r/{referralCode}</code>
            <button onClick={copyReferral} className="text-secondary hover:text-primary transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" onClick={shareReferral} className="gap-2">
            <MessageCircle className="w-4 h-4" /> Compartir por WhatsApp
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RewardsPage;
