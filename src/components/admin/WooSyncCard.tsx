import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Database, ShoppingBag } from "lucide-react";

interface SyncRun {
  id: string;
  kind: "catalog" | "orders";
  trigger: string;
  started_at: string;
  finished_at: string | null;
  items_synced: number;
  status: "running" | "success" | "error";
  error: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace segundos";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

export default function WooSyncCard() {
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [productsMirrored, setProductsMirrored] = useState(0);
  const [busy, setBusy] = useState<null | "catalog" | "orders">(null);

  const load = async () => {
    const [{ data: rs }, { count }] = await Promise.all([
      supabase
        .from("woo_sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10),
      supabase
        .from("productos")
        .select("*", { count: "exact", head: true })
        .eq("woo_source", true),
    ]);
    setRuns((rs as SyncRun[]) || []);
    setProductsMirrored(count || 0);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const trigger = async (kind: "catalog" | "orders") => {
    setBusy(kind);
    try {
      const fn = kind === "catalog" ? "woo-catalog-sync" : "woo-orders-mirror";
      const { data, error } = await supabase.functions.invoke(fn, { body: {} });
      if (error) throw error;
      toast({
        title: `Sincronización completa`,
        description:
          kind === "catalog"
            ? `${data?.synced ?? 0} productos sincronizados`
            : `${data?.orders ?? 0} pedidos / ${data?.items ?? 0} líneas`,
      });
      await load();
    } catch (e: any) {
      toast({
        title: "Error en sincronización",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const lastCatalog = runs.find((r) => r.kind === "catalog");
  const lastOrders = runs.find((r) => r.kind === "orders");

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" /> Espejo de WooCommerce
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only desde tu tienda. Tu Woo no se modifica.
          </p>
        </div>
        <Badge variant="outline">{productsMirrored} productos espejo</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm flex items-center gap-2">
              <Database className="w-4 h-4" /> Catálogo
            </span>
            <StatusBadge run={lastCatalog} />
          </div>
          <p className="text-xs text-muted-foreground">
            Última sync: {timeAgo(lastCatalog?.finished_at ?? null)}
            {lastCatalog?.items_synced
              ? ` · ${lastCatalog.items_synced} items`
              : ""}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => trigger("catalog")}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 ${busy === "catalog" ? "animate-spin" : ""}`} />
            Sincronizar catálogo
          </Button>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Pedidos
            </span>
            <StatusBadge run={lastOrders} />
          </div>
          <p className="text-xs text-muted-foreground">
            Última sync: {timeAgo(lastOrders?.finished_at ?? null)}
            {lastOrders?.items_synced
              ? ` · ${lastOrders.items_synced} líneas`
              : ""}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => trigger("orders")}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 ${busy === "orders" ? "animate-spin" : ""}`} />
            Sincronizar pedidos
          </Button>
        </div>
      </div>

      {runs.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Últimas ejecuciones</summary>
          <ul className="mt-2 space-y-1 font-mono">
            {runs.map((r) => (
              <li key={r.id} className="flex gap-2">
                <span>{new Date(r.started_at).toLocaleString("es-MX")}</span>
                <span className="uppercase">{r.kind}</span>
                <span>{r.trigger}</span>
                <span>{r.status}</span>
                <span>{r.items_synced} items</span>
                {r.error && <span className="text-destructive">· {r.error.slice(0, 60)}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

function StatusBadge({ run }: { run?: SyncRun }) {
  if (!run) return <Badge variant="outline">Sin datos</Badge>;
  if (run.status === "running") return <Badge>En curso</Badge>;
  if (run.status === "error") return <Badge variant="destructive">Error</Badge>;
  return <Badge variant="secondary">OK</Badge>;
}