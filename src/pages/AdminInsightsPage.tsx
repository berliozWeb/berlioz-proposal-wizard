import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Copy, Pencil, Plus, Trash2, RefreshCw } from "lucide-react";

interface Insight {
  id: string;
  insight_type: string;
  context_key: string;
  insight_text: string;
}

interface Quote {
  id: string;
  created_at: string;
  empresa: string | null;
  categoria: string | null;
  num_personas: number | null;
  status: string;
}

const empty: Omit<Insight, "id"> = { insight_type: "", context_key: "", insight_text: "" };

const AdminInsightsPage = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [wooCount, setWooCount] = useState<number>(0);
  const [editing, setEditing] = useState<Insight | null>(null);
  const [creating, setCreating] = useState<typeof empty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/woo-webhook`;

  const load = async () => {
    setLoading(true);
    const [{ data: ins }, { data: qts }, { count }] = await Promise.all([
      supabase
        .from("sales_insights")
        .select("id, insight_type, context_key, insight_text")
        .order("insight_type")
        .order("context_key"),
      supabase
        .from("quotes")
        .select("id, created_at, empresa, categoria, num_personas, status")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("woo_order_items").select("*", { count: "exact", head: true }),
    ]);
    setInsights((ins as Insight[]) || []);
    setQuotes((qts as Quote[]) || []);
    setWooCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("sales_insights")
      .update({
        insight_type: editing.insight_type,
        context_key: editing.context_key,
        insight_text: editing.insight_text,
      })
      .eq("id", editing.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Insight actualizado" });
      setEditing(null);
      load();
    }
  };

  const saveCreate = async () => {
    if (!creating) return;
    const { error } = await supabase.from("sales_insights").insert(creating);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Insight creado" });
      setCreating(null);
      load();
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("sales_insights").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Insight eliminado" });
      setDeleteId(null);
      load();
    }
  };

  const updateQuoteStatus = async (id: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Cotización ${status === "accepted" ? "aceptada" : "rechazada"}` });
      load();
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "URL copiada al portapapeles" });
  };

  return (
    <div className="min-h-screen bg-background p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin · Insights de ventas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los datos que alimentan a ANA y monitorea cotizaciones.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </Button>
      </header>

      {/* Secrets reminder */}
      <Card className="p-4 bg-muted/50 border-dashed">
        <h3 className="font-semibold mb-2">🔑 Secrets requeridos en Supabase</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• <code>ANTHROPIC_API_KEY</code> — para ANA (debe estar configurado)</li>
          <li>• <code>WOO_WEBHOOK_SECRET</code> — clave HMAC del webhook de WooCommerce (opcional pero recomendado)</li>
        </ul>
      </Card>

      {/* Insights table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sales Insights ({insights.length})</h2>
          <Button onClick={() => setCreating({ ...empty })}>
            <Plus className="w-4 h-4" /> Agregar insight
          </Button>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Context key</TableHead>
                <TableHead>Texto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.map((i) => (
                <TableRow key={i.id}>
                  <TableCell><Badge variant="outline">{i.insight_type}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{i.context_key}</TableCell>
                  <TableCell className="max-w-md text-sm">
                    {i.insight_text.length > 80
                      ? i.insight_text.slice(0, 80) + "…"
                      : i.insight_text}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(i)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(i.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {insights.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Sin insights todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* Quotes section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Últimas 50 cotizaciones de ANA</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Personas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="text-xs">
                    {new Date(q.created_at).toLocaleString("es-MX")}
                  </TableCell>
                  <TableCell>{q.empresa || "—"}</TableCell>
                  <TableCell>{q.categoria || "—"}</TableCell>
                  <TableCell>{q.num_personas || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        q.status === "accepted"
                          ? "default"
                          : q.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuoteStatus(q.id, "accepted")}
                    >
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuoteStatus(q.id, "rejected")}
                    >
                      Rechazar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aún no hay cotizaciones.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* WooCommerce config */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Configuración WooCommerce</h2>
        <Card className="p-6 space-y-4">
          <div>
            <Label>URL del webhook</Label>
            <div className="flex gap-2 mt-1">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={copyUrl}>
                <Copy className="w-4 h-4" /> Copiar
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Pega esta URL en <strong>WooCommerce → Ajustes → Avanzado → Webhooks</strong>.
            </p>
            <p>
              Evento: <strong>Pedido completado</strong>. Agrega{" "}
              <code>WOO_WEBHOOK_SECRET</code> en los secrets de Supabase con la misma clave que
              pongas en WooCommerce.
            </p>
          </div>
          <div className="pt-4 border-t">
            <Badge variant={wooCount > 0 ? "default" : "secondary"}>
              {wooCount} registros sincronizados desde WooCommerce
            </Badge>
          </div>
        </Card>
      </section>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar insight</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Tipo</Label>
                <Input
                  value={editing.insight_type}
                  onChange={(e) => setEditing({ ...editing, insight_type: e.target.value })}
                />
              </div>
              <div>
                <Label>Context key</Label>
                <Input
                  value={editing.context_key}
                  onChange={(e) => setEditing({ ...editing, context_key: e.target.value })}
                />
              </div>
              <div>
                <Label>Texto</Label>
                <Textarea
                  rows={6}
                  value={editing.insight_text}
                  onChange={(e) => setEditing({ ...editing, insight_text: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={!!creating} onOpenChange={(o) => !o && setCreating(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo insight</DialogTitle></DialogHeader>
          {creating && (
            <div className="space-y-3">
              <div>
                <Label>Tipo</Label>
                <Input
                  placeholder="ej. top_products, ticket_bands…"
                  value={creating.insight_type}
                  onChange={(e) => setCreating({ ...creating, insight_type: e.target.value })}
                />
              </div>
              <div>
                <Label>Context key</Label>
                <Input
                  placeholder="ej. working_lunch, desayuno…"
                  value={creating.context_key}
                  onChange={(e) => setCreating({ ...creating, context_key: e.target.value })}
                />
              </div>
              <div>
                <Label>Texto</Label>
                <Textarea
                  rows={6}
                  value={creating.insight_text}
                  onChange={(e) => setCreating({ ...creating, insight_text: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(null)}>Cancelar</Button>
            <Button onClick={saveCreate}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar insight?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ANA dejará de usar este dato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminInsightsPage;
