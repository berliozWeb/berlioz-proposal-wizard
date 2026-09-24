import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Search, CalendarCheck, CalendarX } from "lucide-react";

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente de pago", variant: "outline" },
  processing: { label: "Procesando", variant: "default" },
  "on-hold": { label: "En espera", variant: "secondary" },
  completed: { label: "Completado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "destructive" },
  failed: { label: "Fallido", variant: "destructive" },
};

const fmt = (n: number | null) => n == null ? "—" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const AdminOrdersPage = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin_web_orders"],
    queryFn: async () => {
      const [{ data: orders }, { data: cal }] = await Promise.all([
        supabase.from("web_orders").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("order_calendar_events").select("woo_order_id,status,last_error"),
      ]);
      const calMap = new Map((cal ?? []).map((c) => [Number(c.woo_order_id), c]));
      return (orders ?? []).map((o) => ({ ...o, cal: calMap.get(Number(o.woo_order_id)) }));
    },
    refetchInterval: 60_000,
  });

  const rows = useMemo(() => (data ?? []).filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    const d = o.created_at.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return [o.order_number, o.customer_name, o.customer_email, o.company].some((v) => v?.toLowerCase().includes(s));
    }
    return true;
  }), [data, q, status, from, to]);

  return (
    <AdminLayout title="Pedidos de la página nueva">
      <p className="font-body text-sm text-muted-foreground mb-4">Solo consulta. Para cambiar un pedido ábrelo en la tienda.</p>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Número, cliente o empresa" className="pl-9" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background font-body text-sm">
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" aria-label="Desde" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" aria-label="Hasta" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Calendario</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Cargando…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Aún no hay pedidos con estos filtros.</TableCell></TableRow>
            ) : rows.map((o) => {
              const st = STATUS[o.status] ?? { label: o.status, variant: "outline" as const };
              return (
                <TableRow key={o.woo_order_id}>
                  <TableCell className="font-semibold">#{o.order_number}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{new Date(o.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                  <TableCell className="text-sm">
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.company || o.customer_email}</div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {o.delivery_date}<div className="text-xs text-muted-foreground">{o.delivery_slot}{o.delivery_type === "pickup" ? " · Recoge" : ""}</div>
                  </TableCell>
                  <TableCell className="text-right text-sm">{fmt(o.total)}</TableCell>
                  <TableCell><Badge variant={st.variant} className="whitespace-nowrap">{st.label}</Badge></TableCell>
                  <TableCell className="text-sm">
                    {o.cal?.status === "created" ? <span className="flex items-center gap-1 text-primary"><CalendarCheck className="w-4 h-4" />Creado</span>
                      : o.cal?.status === "error" ? <span className="flex items-center gap-1 text-destructive" title={o.cal.last_error ?? ""}><CalendarX className="w-4 h-4" />Error</span>
                      : o.cal?.status === "deleted" ? <span className="text-muted-foreground">Retirado</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <a href={`https://berlioz.mx/wp-admin/post.php?post=${o.woo_order_id}&action=edit`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline whitespace-nowrap">
                      Ver en la tienda <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
