import berliozLogo from "@/assets/berlioz-logo.png";
import BerliozHeader from "@/components/BerliozHeader";
import PackageCard from "@/components/proposal/PackageCard";
import LeadGateModal from "@/components/proposal/LeadGateModal";
import LeadsViewerModal from "@/components/proposal/LeadsViewerModal";
import ExtrasModal from "@/components/proposal/ExtrasModal";
import { useProposalPresenter } from "@/presentation/hooks/useProposalPresenter";
import { EVENT_TYPE_LABELS, type EventType } from "@/domain/value-objects/EventType";

const Propuesta = () => {
  const p = useProposalPresenter();

  if (!p.form) return null;

  return (
    <div className="min-h-screen bg-background">
      <BerliozHeader />

      <main className="flex-1 p-6 lg:p-10">
        {!p.proposal ? (
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
                Ciudad de México, {new Date(p.proposal.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="mt-4 space-y-1 text-sm text-foreground">
                <p><span className="text-muted-foreground">Atención:</span> {p.form.nombre}</p>
                <p><span className="text-muted-foreground">Empresa:</span> {p.form.empresa}</p>
                <p><span className="text-muted-foreground">Evento:</span> {EVENT_TYPE_LABELS[p.form.eventType as EventType]}</p>
                <p><span className="text-muted-foreground">Fecha:</span> {p.form.fechaInicio}{p.form.fechaFin ? ` — ${p.form.fechaFin}` : ''}</p>
                <p><span className="text-muted-foreground">Personas:</span> {p.form.personas}</p>
              </div>
              <p className="mt-6 text-foreground leading-relaxed">{p.proposal.intro}</p>
            </div>

            {/* Packages */}
            <div className="proposal-packages grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {p.proposal.packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isRecommended={pkg.id === 'recomendado'}
                  onSelect={() => p.handlePackageSelect(pkg.displayName)}
                />
              ))}
            </div>

            {p.proposal.recommendedReason && (
              <p className="text-sm text-muted-foreground italic mb-8 text-center">
                💡 {p.proposal.recommendedReason}
              </p>
            )}

            {/* Extras note */}
            {p.extraLabels.length > 0 && (
              <div className="border border-accent/30 bg-accent/5 rounded-lg p-5 mb-8">
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">
                  Servicios adicionales solicitados
                </h3>
                <ul className="space-y-1.5">
                  {p.extraLabels.map((label, i) => (
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
                {p.proposal.businessRules.map((rule, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span>•</span><span>{rule}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-mono text-muted-foreground mt-4">
                Válida hasta: {p.proposal.validUntil} | ID: {p.proposal.proposalId}
              </p>
            </div>

            {/* Action bar */}
            <div className="no-print sticky bottom-0 bg-background/90 backdrop-blur border-t border-border py-4 flex flex-wrap gap-3 justify-center">
              <button onClick={() => p.openGateDirectly('pdf')} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Descargar PDF
              </button>
              <button onClick={() => p.openGateDirectly('email')} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Enviar por email
              </button>
              <button onClick={p.navigateToWizard} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Modificar cotización
              </button>
              <button
                onClick={() => p.openGateDirectly('select', 'Confirmar pedido')}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Confirmar pedido →
              </button>
            </div>

            {/* Footer */}
            <div className="no-print text-center py-6">
              <button
                onClick={() => p.setLeadsOpen(true)}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline"
              >
                Ver leads capturados
              </button>
            </div>

            <div className="print-footer hidden print:block">
              berlioz.mx | hola@berlioz.mx | 55 8237 5469
            </div>
          </div>
        )}
      </main>

      <ExtrasModal
        open={p.extrasOpen}
        selectedExtras={p.selectedExtras}
        onToggle={p.toggleExtra}
        onSkip={p.proceedToGate}
        onContinue={p.proceedToGate}
      />
      <LeadGateModal
        open={p.gateOpen}
        onClose={() => p.setGateOpen(false)}
        defaultEmail=""
        defaultEmpresa={p.form.empresa}
        onSubmit={p.handleGateSubmit}
      />
      <LeadsViewerModal open={p.leadsOpen} onClose={() => p.setLeadsOpen(false)} />
    </div>
  );
};

export default Propuesta;
