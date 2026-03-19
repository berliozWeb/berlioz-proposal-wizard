import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BerliozHeader from "@/components/BerliozHeader";
import PackageCard from "@/components/proposal/PackageCard";
import LeadGateModal from "@/components/proposal/LeadGateModal";
import LeadsViewerModal from "@/components/proposal/LeadsViewerModal";
import ExtrasModal from "@/components/proposal/ExtrasModal";
import { AVAILABLE_EXTRAS } from "@/components/proposal/ExtrasModal";
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

type PendingAction = 'select' | 'pdf' | 'email';

function saveLead(form: IntakeForm, email: string, empresa: string, packageSelected: string) {
  try {
    const raw = localStorage.getItem('berlioz_leads');
    const leads = raw ? JSON.parse(raw) : [];
    leads.push({
      name: form.nombre,
      company: empresa,
      phone: form.celular,
      email,
      eventType: form.eventType,
      date: form.fechaInicio,
      personas: form.personas,
      packageSelected,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('berlioz_leads', JSON.stringify(leads));
  } catch { /* ignore */ }
}

const Propuesta = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const form = (location.state as { form: IntakeForm })?.form;

  const [, setAgents] = useState<AgentState[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [leadsOpen, setLeadsOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [selectedPkg, setSelectedPkg] = useState('');

  useEffect(() => {
    if (!form) {
      navigate('/');
      return;
    }
    runAgentPipeline(form, setAgents).then(setProposal);
  }, []);

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePackageSelect = useCallback((pkgName: string) => {
    setSelectedPkg(pkgName);
    setPendingAction('select');
    setExtrasOpen(true);
  }, []);

  const proceedToGate = useCallback(() => {
    setExtrasOpen(false);
    setGateOpen(true);
  }, []);

  const openGateDirectly = useCallback((action: PendingAction, pkgName?: string) => {
    setPendingAction(action);
    setSelectedPkg(pkgName || '');
    setGateOpen(true);
  }, []);

  const handleGateSubmit = useCallback((email: string, empresa: string) => {
    if (!form || !proposal) return;
    setGateOpen(false);

    saveLead(form, email, empresa, selectedPkg || 'N/A');

    if (pendingAction === 'pdf') {
      window.print();
    } else if (pendingAction === 'email') {
      const subject = encodeURIComponent(`Propuesta Berlioz — ${empresa}`);
      const body = encodeURIComponent(`Hola ${form.nombre},\n\nAdjunto nuestra propuesta de catering para ${empresa}.\n\nQuedo a tus órdenes.\n\nBerlioz\nhola@berlioz.mx`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    } else if (pendingAction === 'select') {
      toast.success(`Paquete "${selectedPkg}" seleccionado. Nos pondremos en contacto contigo.`);
    }
  }, [form, proposal, pendingAction, selectedPkg]);

  if (!form) return null;

  const extraLabels = selectedExtras
    .map((id) => AVAILABLE_EXTRAS.find((e) => e.id === id)?.title)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <BerliozHeader />

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
              <img src={berliozLogo} alt="Berlioz" className="h-8 mb-1" />
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
                  onSelect={() => handlePackageSelect(pkg.displayName)}
                />
              ))}
            </div>

            {proposal.recommendedReason && (
              <p className="text-sm text-muted-foreground italic mb-8 text-center">
                💡 {proposal.recommendedReason}
              </p>
            )}

            {/* Extras note in proposal (visible in print) */}
            {extraLabels.length > 0 && (
              <div className="border border-accent/30 bg-accent/5 rounded-lg p-5 mb-8">
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">
                  Servicios adicionales solicitados
                </h3>
                <ul className="space-y-1.5">
                  {extraLabels.map((label, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-accent">✦</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Nuestro equipo se pondrá en contacto para coordinar los detalles de personalización.
                </p>
              </div>
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
              <button onClick={() => openGateDirectly('pdf')} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Descargar PDF
              </button>
              <button onClick={() => openGateDirectly('email')} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Enviar por email
              </button>
              <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Modificar cotización
              </button>
              <button
                onClick={() => openGateDirectly('select', 'Confirmar pedido')}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Confirmar pedido →
              </button>
            </div>

            {/* Footer */}
            <div className="no-print text-center py-6">
              <button
                onClick={() => setLeadsOpen(true)}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline"
              >
                Ver leads capturados
              </button>
            </div>

            {/* Print footer */}
            <div className="print-footer hidden print:block">
              berlioz.mx | hola@berlioz.mx | 55 8237 5469
            </div>
          </div>
        )}
      </main>

      <ExtrasModal
        open={extrasOpen}
        selectedExtras={selectedExtras}
        onToggle={toggleExtra}
        onSkip={proceedToGate}
        onContinue={proceedToGate}
      />
      <LeadGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        defaultEmail=""
        defaultEmpresa={form.empresa}
        onSubmit={handleGateSubmit}
      />
      <LeadsViewerModal open={leadsOpen} onClose={() => setLeadsOpen(false)} />
    </div>
  );
};

export default Propuesta;
