import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Download, ShoppingBag, Share2, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import BaseLayout from "@/components/layout/BaseLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuoteOption {
  name: string;
  tagline: string;
  items: string[];
  pricePerPerson: number;
  totalPrice: number;
  whyItFits: string;
}

interface Quote {
  id: string;
  client_name: string | null;
  event_type: string;
  people_count: number;
  event_date: string | null;
  time_slot: string | null;
  dietary_restrictions: string[];
  budget_per_person: number | null;
  ai_options: QuoteOption[];
  selected_option_index: number | null;
  status: string;
  total_estimated: number;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  ready: { label: "Lista para enviar", className: "bg-blue-light text-secondary" },
  converted: { label: "Convertida a pedido", className: "bg-success/10 text-success" },
};

const EVENT_LABELS: Record<string, string> = {
  junta: "Junta ejecutiva", desayuno: "Desayuno de trabajo", coffee_am: "Coffee Break AM",
  coffee_pm: "Coffee Break PM", comida: "Comida de equipo", evento_especial: "Evento especial",
};

const QuotesPage = () => {
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const isAgency = profile?.profile_type === "agency";

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewQuote, setViewQuote] = useState<Quote | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("quotes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setQuotes((data as Quote[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const stats = {
    active: quotes.filter((q) => q.status !== "converted").length,
    converted: quotes.filter((q) => q.status === "converted").length,
    thisWeek: quotes.filter((q) => new Date(q.created_at) >= new Date(Date.now() - 7 * 86400000)).length,
  };

  const handleNewQuote = () => { isAgency ? setShowNewModal(true) : navigate("/cotizar"); };

  const handleConvertToOrder = (quote: Quote) => {
    if (quote.selected_option_index === null || !quote.ai_options.length) { toast.error("Selecciona una opción primero"); return; }
    const opt = quote.ai_options[quote.selected_option_index];
    opt.items.forEach((itemName, i) => {
      addItem({ id: `quote-${quote.id}-${i}`, name: itemName, price: opt.pricePerPerson / opt.items.length, quantity: quote.people_count });
    });
    toast.success("Productos agregados al carrito");
    navigate("/checkout");
  };

  const handleWhatsApp = (quote: Quote) => {
    const opt = quote.selected_option_index !== null ? quote.ai_options[quote.selected_option_index] : null;
    const text = `🍱 Cotización Berlioz\n${quote.client_name ? `Cliente: ${quote.client_name}\n` : ""}Evento: ${EVENT_LABELS[quote.event_type] || quote.event_type}\n${quote.people_count} personas${opt ? `\nOpción: ${opt.name}\nTotal: $${opt.totalPrice.toLocaleString()} MXN` : ""}\n\nberlioz.mx/cotizar`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <BaseLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-3xl text-foreground">Mis cotizaciones</h1>
          <button onClick={handleNewQuote} className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Nueva cotización →
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[{ label: "Cotizaciones activas", value: stats.active }, { label: "Convertidas a pedido", value: stats.converted }, { label: "Esta semana", value: stats.thisWeek }].map((s) => (
            <div key={s.label} className="bg-card rounded-lg border border-border p-4">
              <p className="font-mono text-2xl text-foreground font-bold">{s.value}</p>
              <p className="font-body text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-blue-light mx-auto flex items-center justify-center mb-4"><FileText className="w-7 h-7 text-secondary" /></div>
            <p className="font-body text-muted-foreground mb-4">Aún no tienes cotizaciones guardadas</p>
            <button onClick={handleNewQuote} className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors">Crear primera cotización →</button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {[isAgency ? "Cliente" : "Empresa", "Evento", "Personas", "Opción", "Total", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotes.map((q) => {
                    const status = STATUS_MAP[q.status] || STATUS_MAP.draft;
                    const selectedOpt = q.selected_option_index !== null ? q.ai_options[q.selected_option_index] : null;
                    return (
                      <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-body text-sm text-foreground">{q.client_name || profile?.company_name || "—"}</td>
                        <td className="px-4 py-3 font-body text-sm text-foreground">
                          {EVENT_LABELS[q.event_type] || q.event_type}
                          {q.event_date && <span className="block text-xs text-muted-foreground">{format(new Date(q.event_date + "T12:00:00"), "d MMM yyyy", { locale: es })}</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{q.people_count}</td>
                        <td className="px-4 py-3 font-body text-sm text-foreground">{selectedOpt?.name || <span className="text-muted-foreground">Sin selección</span>}</td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground">${(q.total_estimated || selectedOpt?.totalPrice || 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={cn("px-2.5 py-1 rounded-full font-body text-[10px] font-semibold", status.className)}>{status.label}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewQuote(q)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Ver"><Eye className="w-4 h-4" /></button>
                            <Link to={`/cotizar?quoteId=${q.id}`} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Editar"><Pencil className="w-4 h-4" /></Link>
                            <button onClick={() => toast.info("Exportar PDF próximamente")} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="PDF"><Download className="w-4 h-4" /></button>
                            {q.status !== "converted" && (
                              <button onClick={() => handleConvertToOrder(q)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Convertir"><ShoppingBag className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {viewQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setViewQuote(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 animate-slide-up">
            <button onClick={() => setViewQuote(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
            <h2 className="font-heading text-xl text-foreground mb-1">Detalle de cotización</h2>
            {viewQuote.client_name && <p className="font-body text-sm text-muted-foreground mb-4">Cliente: {viewQuote.client_name}</p>}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[{ label: "Evento", value: EVENT_LABELS[viewQuote.event_type] || viewQuote.event_type }, { label: "Personas", value: viewQuote.people_count }, { label: "Fecha", value: viewQuote.event_date ? format(new Date(viewQuote.event_date + "T12:00:00"), "d MMM yyyy", { locale: es }) : "—" }, { label: "Horario", value: viewQuote.time_slot || "—" }].map((item) => (
                <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="font-body text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            {viewQuote.ai_options.length > 0 && (
              <div className="space-y-3 mb-6">
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Opciones de menú</p>
                {viewQuote.ai_options.map((opt, idx) => {
                  const isSelected = viewQuote.selected_option_index === idx;
                  return (
                    <div key={idx} className={cn("rounded-lg border p-4", isSelected ? "border-primary bg-blue-light" : "border-border")}>
                      <div className="flex items-start justify-between">
                        <div><h4 className="font-body font-semibold text-sm text-foreground">{opt.name}</h4><p className="font-body text-xs text-muted-foreground italic">{opt.tagline}</p></div>
                        {isSelected && <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-body text-[10px] font-semibold">Seleccionada</span>}
                      </div>
                      <ul className="mt-2 space-y-0.5">{opt.items.map((item, i) => <li key={i} className="font-body text-xs text-foreground">• {item}</li>)}</ul>
                      <p className="font-mono text-sm text-secondary font-bold mt-2">${opt.pricePerPerson}/persona · Total ${opt.totalPrice.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { handleConvertToOrder(viewQuote); setViewQuote(null); }} className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90"><ShoppingBag className="w-4 h-4" /> Hacer pedido</button>
              <button onClick={() => toast.info("Exportar PDF próximamente")} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-foreground font-body text-sm hover:bg-muted"><Download className="w-4 h-4" /> PDF</button>
              <button onClick={() => handleWhatsApp(viewQuote)} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-foreground font-body text-sm hover:bg-muted"><Share2 className="w-4 h-4" /> WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* Agency New Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <button onClick={() => setShowNewModal(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
            <h2 className="font-heading text-xl text-foreground mb-4">Nueva cotización</h2>
            <label className="block font-body text-sm font-medium text-foreground mb-2">¿Para qué cliente es esta cotización?</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4" />
            <button onClick={() => { clientName.trim() && navigate(`/cotizar?client=${encodeURIComponent(clientName.trim())}`); setShowNewModal(false); }} disabled={!clientName.trim()} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">Continuar al cotizador →</button>
          </div>
        </div>
      )}
    </BaseLayout>
  );
};

export default QuotesPage;
