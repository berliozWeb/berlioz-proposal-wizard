import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BerliozHeader from "@/components/BerliozHeader";
import AgentCard from "@/components/proposal/AgentCard";
import PackageCard from "@/components/proposal/PackageCard";
import { runAgentPipeline } from "@/lib/agents";
import type { IntakeForm, AgentState, Proposal } from "@/types";
import { toast } from "sonner";

const EVENT_LABELS: Record<string, string> = {
  desayuno: 'Desayuno corporativo',
  coffee_break: 'Coffee break',
  comida: 'Comida de trabajo',
  capacitacion: 'Capacitación (día completo)',
  evento_especial: 'Evento especial',
  otro: 'Otro',
};

const Propuesta = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const form = (location.state as { form: IntakeForm })?.form;

  const [agents, setAgents] = useState<AgentState[]>([
    { id: 'discovery', name: 'Análisis del evento', icon: '🔍', status: 'idle', logs: [] },
    { id: 'menu', name: 'Selección de menú', icon: '🍽️', status: 'idle', logs: [] },
    { id: 'pricing', name: 'Cálculo de precios', icon: '💰', status: 'idle', logs: [] },
    { id: 'writer', name: 'Generación de propuesta', icon: '✍️', status: 'idle', logs: [] },
  ]);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (!form) {
      navigate('/');
      return;
    }
    runAgentPipeline(form, setAgents).then(setProposal);
  }, []);

  if (!form) return null;

  const handlePrint = () => window.print();
  const handleEmail = () => {
    const subject = encodeURIComponent(`Propuesta Berlioz — ${form.empresa}`);
    const body = encodeURIComponent(`Hola ${form.nombre},\n\nAdjunto nuestra propuesta de catering para ${form.empresa}.\n\nQuedo a tus órdenes.\n\nBerlioz\nhola@berlioz.mx`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSelect = (pkgName: string) => {
    toast.success(`Paquete "${pkgName}" seleccionado. Nos pondremos en contacto contigo.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <BerliozHeader />
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Pipeline */}
        <aside className="no-print lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-6 lg:min-h-[calc(100vh-73px)]">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Pipeline de generación</h2>
          <div className="space-y-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-10">
          {!proposal ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Generando tu propuesta...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="mb-10">
                <h1 className="font-heading text-3xl font-bold tracking-[0.15em] text-primary uppercase mb-1">BERLIOZ</h1>
                <p className="text-sm text-muted-foreground font-mono">
                  Ciudad de México, {new Date(proposal.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="mt-4 space-y-1 text-sm text-foreground">
                  <p><span className="text-muted-foreground">Atención:</span> {form.nombre}</p>
                  <p><span className="text-muted-foreground">Empresa:</span> {form.empresa}</p>
                  <p><span className="text-muted-foreground">Evento:</span> {EVENT_LABELS[form.eventType]}</p>
                  <p><span className="text-muted-foreground">Fecha:</span> {form.fechaInicio}{form.fechaFin ? ` — ${form.fechaFin}` : ''}</p>
                  <p><span className="text-muted-foreground">Personas:</span> {form.personas}</p>
                </div>
                <p className="mt-6 text-foreground leading-relaxed">{proposal.intro}</p>
              </div>

              {/* Packages */}
              <div className="proposal-packages grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {proposal.packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isRecommended={pkg.id === 'recomendado'}
                    onSelect={() => handleSelect(pkg.displayName)}
                  />
                ))}
              </div>

              {proposal.recommendedReason && (
                <p className="text-sm text-muted-foreground italic mb-8 text-center">
                  💡 {proposal.recommendedReason}
                </p>
              )}

              {/* Business Rules */}
              <div className="border-t border-border pt-6 mb-8">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Condiciones generales</h3>
                <ul className="space-y-2">
                  {proposal.businessRules.map((rule, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span>•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-mono text-muted-foreground mt-4">
                  Válida hasta: {proposal.validUntil} | ID: {proposal.proposalId}
                </p>
              </div>

              {/* Action bar */}
              <div className="no-print sticky bottom-0 bg-background/90 backdrop-blur border-t border-border py-4 flex flex-wrap gap-3 justify-center">
                <button onClick={handlePrint} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                  Descargar PDF
                </button>
                <button onClick={handleEmail} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                  Enviar por email
                </button>
                <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                  Modificar cotización
                </button>
                <button
                  onClick={() => toast.success('¡Gracias! Nos pondremos en contacto contigo pronto.')}
                  className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Confirmar pedido →
                </button>
              </div>

              {/* Print footer */}
              <div className="print-footer hidden print:block">
                berlioz.mx | hola@berlioz.mx | 55 8237 5469
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Propuesta;
