import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, DollarSign, Truck, Star, RefreshCw, Edit, Calendar, Pause, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN } from "@/domain/value-objects/Money";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ScheduleOrderModal from "@/components/dashboard/ScheduleOrderModal";

interface OrderRow {
  id: string;
  order_number: string;
  delivery_date: string;
  delivery_slot: string;
  total: number;
  status: string;
  created_at: string;
  items: { product_name: string; quantity: number; unit_price: number }[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmado", color: "bg-success/10 text-success" },
  in_transit: { label: "En camino", color: "bg-secondary/10 text-secondary" },
  delivered: { label: "Entregado", color: "bg-muted text-muted-foreground" },
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
};

const DashboardPage = () => {
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [lastOrder, setLastOrder] = useState<OrderRow | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [monthStats, setMonthStats] = useState({ count: 0, spend: 0, nextDelivery: null as OrderRow | null });
  const [teammates, setTeammates] = useState<{ full_name: string | null; avatar_url: string | null }[]>([]);
  const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const loyaltyPoints = (profile as any)?.loyalty_points ?? 0;

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Last order with items
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (orders && orders.length > 0) {
      // Load items for all orders
      const orderIds = orders.map((o) => o.id);
      const { data: allItems } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      const enriched = orders.map((o) => ({
        ...o,
        items: (allItems ?? []).filter((i) => i.order_id === o.id),
      })) as OrderRow[];

      setLastOrder(enriched[0]);
      setRecentOrders(enriched);

      // Month stats
      const monthOrders = orders.filter((o) => o.created_at >= monthStart);
      const nextConfirmed = orders.find((o) => o.status === "confirmed" && o.delivery_date >= now.toISOString().slice(0, 10));
      setMonthStats({
        count: monthOrders.length,
        spend: monthOrders.reduce((s, o) => s + Number(o.total), 0),
        nextDelivery: nextConfirmed ? enriched.find((e) => e.id === nextConfirmed.id) ?? null : null,
      });
    }

    // Team
    if (profile?.email_domain) {
      const { data: team } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("email_domain", profile.email_domain)
        .limit(20);
      setTeammates(team ?? []);
    }

    // Scheduled orders
    const { data: scheduled } = await supabase
      .from("scheduled_orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);
    setScheduledOrders(scheduled ?? []);
  };

  const handleRepeatOrder = (order: OrderRow, goToStep: number) => {
    order.items.forEach((item) => {
      addItem({ id: `repeat-${order.id}-${item.product_name}`, name: item.product_name, price: item.unit_price, quantity: item.quantity, image: (item as any).image_url });
    });
    navigate("/checkout");
  };

  const tierName = loyaltyPoints > 1500 ? "Oro" : loyaltyPoints > 500 ? "Plata" : "Bronce";
  const nextTier = loyaltyPoints > 1500 ? 3000 : loyaltyPoints > 500 ? 1501 : 501;
  const tierColors = { Bronce: "text-amber-600", Plata: "text-gray-500", Oro: "text-yellow-500" };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome */}
        <h1 className="font-heading text-2xl text-foreground">
          Hola, {profile?.full_name?.split(" ")[0] ?? "Usuario"} 👋
        </h1>

        {/* Section 1: Quick Reorder */}
        {lastOrder && (
          <div className="rounded-xl bg-blue-light p-6">
            <h2 className="font-heading text-lg text-foreground mb-3">Tu pedido habitual</h2>
            <p className="font-body text-xs text-muted-foreground mb-2">
              Último pedido: {new Date(lastOrder.created_at).toLocaleDateString("es-MX")}
            </p>
            <div className="font-body text-sm text-foreground mb-1">
              {lastOrder.items.slice(0, 3).map((item, i) => (
                <span key={i}>{item.product_name}{i < Math.min(2, lastOrder.items.length - 1) ? " · " : ""}</span>
              ))}
              {lastOrder.items.length > 3 && <span className="text-muted-foreground"> +{lastOrder.items.length - 3} más</span>}
            </div>
            <p className="font-body font-semibold text-primary mb-4">{formatMXN(lastOrder.total)}</p>
            <div className="flex gap-3">
              <Button onClick={() => handleRepeatOrder(lastOrder, 1)} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Repetir pedido →
              </Button>
              <Button variant="outline" onClick={() => handleRepeatOrder(lastOrder, 0)} className="gap-2">
                <Edit className="w-4 h-4" /> Modificar antes de pedir
              </Button>
            </div>
            <button onClick={() => setScheduleOpen(true)} className="font-body text-xs text-secondary hover:underline mt-3 block">
              Configurar pedido habitual →
            </button>
          </div>
        )}

        {/* Section 2: Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Package} label="Pedidos este mes" value={String(monthStats.count)} />
          <MetricCard icon={DollarSign} label="Gasto del mes" value={formatMXN(monthStats.spend)} />
          <MetricCard
            icon={Truck}
            label="Próxima entrega"
            value={monthStats.nextDelivery ? monthStats.nextDelivery.delivery_date : "—"}
          />
          <div className="rounded-xl border border-border bg-card p-4">
            <Star className="w-5 h-5 text-primary mb-2" />
            <p className="font-body text-xs text-muted-foreground">Puntos Berlioz</p>
            <p className="font-heading text-xl text-foreground">{loyaltyPoints}</p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, (loyaltyPoints / nextTier) * 100)}%` }} />
            </div>
            <p className="font-body text-[10px] text-muted-foreground mt-1">{tierName} · {nextTier - loyaltyPoints} pts para siguiente</p>
          </div>
        </div>

        {/* Scheduled orders widget */}
        {scheduledOrders.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-sm text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Tus entregas programadas
            </h3>
            {scheduledOrders.map((so) => (
              <div key={so.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="font-body text-sm">
                  <span className="font-medium">{so.frequency === "weekly" ? "Semanal" : so.frequency === "biweekly" ? "Quincenal" : "Mensual"}</span>
                  <span className="text-muted-foreground"> · {so.time_slot} · Próxima: {so.next_delivery_date}</span>
                </div>
                <div className="flex gap-2">
                  <button className="font-body text-xs text-secondary hover:underline">Modificar</button>
                  <button className="font-body text-xs text-muted-foreground hover:underline">Pausar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section 3: Recent Orders */}
        <div>
          <h2 className="font-heading text-lg text-foreground mb-4">Pedidos recientes</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="font-body text-muted-foreground mb-4">Aún no tienes pedidos</p>
              <Button asChild><Link to="/menu">Hacer tu primer pedido →</Link></Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="font-body text-xs text-muted-foreground">
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3 hidden sm:table-cell">Productos</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-center p-3">Estado</th>
                    <th className="text-right p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 10).map((order) => {
                    const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
                    return (
                      <tr key={order.id} className="border-t border-border">
                        <td className="p-3 font-body text-sm">{new Date(order.created_at).toLocaleDateString("es-MX")}</td>
                        <td className="p-3 font-body text-sm text-muted-foreground hidden sm:table-cell truncate max-w-[200px]">
                          {order.items.map((i) => i.product_name).join(", ")}
                        </td>
                        <td className="p-3 font-body text-sm text-right font-medium">{formatMXN(order.total)}</td>
                        <td className="p-3 text-center">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-body font-medium", status.color)}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleRepeatOrder(order, 1)} className="text-xs">
                            Repetir
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {recentOrders.length > 0 && (
            <Link to="/dashboard/pedidos" className="font-body text-sm text-secondary hover:underline mt-3 block">
              Ver todos mis pedidos →
            </Link>
          )}
        </div>

        {/* Section 4: Team */}
        <div>
          <h2 className="font-heading text-lg text-foreground mb-4">Personas de tu empresa en Berlioz</h2>
          {teammates.length <= 1 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="font-body text-muted-foreground mb-3">Eres el primero de tu empresa en Berlioz</p>
              <Button variant="outline">Invitar a un compañero</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {teammates.map((t, i) => {
                const init = t.full_name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-body font-semibold text-sm">
                        {init}
                      </div>
                    )}
                    <span className="font-body text-xs text-muted-foreground">{t.full_name?.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ScheduleOrderModal open={scheduleOpen} onOpenChange={setScheduleOpen} items={lastOrder?.items ?? []} />
    </DashboardLayout>
  );
};

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="w-5 h-5 text-primary mb-2" />
      <p className="font-body text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-xl text-foreground">{value}</p>
    </div>
  );
}

export default DashboardPage;
