import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN } from "@/domain/value-objects/Money";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  order_number: string;
  delivery_date: string;
  delivery_slot: string;
  delivery_address_text: string | null;
  notes: string | null;
  total: number;
  status: string;
  created_at: string;
  items: { product_name: string; quantity: number; unit_price: number; image_url: string | null }[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmado", color: "bg-success/10 text-success" },
  in_transit: { label: "En camino", color: "bg-secondary/10 text-secondary" },
  delivered: { label: "Entregado", color: "bg-muted text-muted-foreground" },
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
};

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const { addItem, clearCart, items: cartItems } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("3months");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadChartData();
  }, [user, dateFilter, statusFilter]);

  const loadOrders = async () => {
    if (!user) return;
    const now = new Date();
    let since: Date;
    switch (dateFilter) {
      case "1month": since = new Date(now.getFullYear(), now.getMonth() - 1, 1); break;
      case "1year": since = new Date(now.getFullYear() - 1, now.getMonth(), 1); break;
      default: since = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    }

    let query = supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const { data } = await query;
    if (!data) { setOrders([]); return; }

    const ids = data.map((o) => o.id);
    const { data: allItems } = await supabase.from("order_items").select("*").in("order_id", ids);

    setOrders(
      data.map((o) => ({ ...o, items: (allItems ?? []).filter((i) => i.order_id === o.id) })) as OrderRow[]
    );
  };

  const loadChartData = async () => {
    if (!user) return;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data } = await supabase
      .from("orders")
      .select("total, created_at")
      .eq("user_id", user.id)
      .gte("created_at", sixMonthsAgo.toISOString());

    if (!data) return;

    const months: Record<string, number> = {};
    data.forEach((o) => {
      const key = new Date(o.created_at).toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
      months[key] = (months[key] ?? 0) + Number(o.total);
    });

    setChartData(Object.entries(months).map(([month, total]) => ({ month, total })));
  };

  const handleRepeat = (order: OrderRow) => {
    if (cartItems.length > 0) {
      if (!confirm("¿Reemplazamos el carrito actual?")) return;
      clearCart();
    }
    order.items.forEach((item) => {
      addItem({ id: `repeat-${order.id}-${item.product_name}`, name: item.product_name, price: item.unit_price, quantity: item.quantity, image: item.image_url ?? undefined });
    });
    navigate("/checkout");
  };

  const paged = orders.slice(page * 20, (page + 1) * 20);
  const totalPages = Math.ceil(orders.length / 20);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="font-heading text-2xl text-foreground">Historial de pedidos</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mes</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="1year">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="in_transit">En camino</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders table */}
        <div className="rounded-xl border border-border overflow-hidden">
          {paged.length === 0 ? (
            <div className="p-12 text-center font-body text-muted-foreground">Sin pedidos para este periodo</div>
          ) : (
            paged.map((order) => {
              const expanded = expandedId === order.id;
              const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
              return (
                <div key={order.id} className="border-b border-border last:border-0">
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <span className="font-body text-sm w-24 shrink-0">{new Date(order.created_at).toLocaleDateString("es-MX")}</span>
                    <span className="font-body text-sm text-muted-foreground flex-1 truncate hidden sm:block">
                      {order.delivery_date} · {order.delivery_slot}
                    </span>
                    <span className="font-body text-sm hidden md:block">{order.items.length} items</span>
                    <span className="font-body text-sm font-medium w-28 text-right">{formatMXN(order.total)}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-body font-medium shrink-0", status.color)}>
                      {status.label}
                    </span>
                    <Button size="sm" variant="ghost" className="text-xs shrink-0 gap-1" onClick={(e) => { e.stopPropagation(); handleRepeat(order); }}>
                      <RefreshCw className="w-3 h-3" /> Repetir
                    </Button>
                    {expanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 bg-muted/20 space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between font-body text-sm">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span>{formatMXN(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.delivery_address_text && (
                        <p className="font-body text-xs text-muted-foreground">📍 {order.delivery_address_text}</p>
                      )}
                      {order.notes && (
                        <p className="font-body text-xs text-muted-foreground">📝 {order.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  "w-8 h-8 rounded-lg font-body text-sm transition-colors",
                  page === i ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted-foreground/10"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Monthly spend chart */}
        {chartData.length > 0 && (
          <div>
            <h2 className="font-heading text-lg text-foreground mb-4">Gasto mensual</h2>
            <div className="rounded-xl border border-border bg-card p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="font-body text-xs" />
                  <YAxis className="font-body text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatMXN(v)} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrderHistoryPage;
