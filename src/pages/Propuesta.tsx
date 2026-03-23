import { useState, useCallback } from "react";
import berliozLogo from "@/assets/berlioz-logo.png";
import BerliozHeader from "@/components/BerliozHeader";
import PackageCard from "@/components/proposal/PackageCard";
import MenuProposal from "@/components/proposal/MenuProposal";
import AddonsBar from "@/components/proposal/AddonsBar";
import LeadGateModal from "@/components/proposal/LeadGateModal";
import LeadsViewerModal from "@/components/proposal/LeadsViewerModal";
import { useProposalPresenter } from "@/presentation/hooks/useProposalPresenter";
import { EVENT_TYPE_LABELS, type EventType } from "@/domain/value-objects/EventType";
import { formatMXN } from "@/domain/value-objects/Money";
import { calculateIVA, roundCents } from "@/domain/value-objects/Money";
import { getSeasonalMessage } from "@/domain/entities/CrossSellData";
import type { PackageItem } from "@/domain/entities/Proposal";
import {
  PRICE_DISCLAIMER_BANNER,
  getNudgeTriggers,
  buildNudgeMailto,
  shouldSuggestStaff,
} from "@/domain/shared/BusinessRules";

const Propuesta = () => {
  const p = useProposalPresenter();

  // Track modified packages
  const [modifiedPkgs, setModifiedPkgs] = useState<Record<string, PackageItem[]>>({});

  const handleItemsChange = useCallback((pkgId: string, items: PackageItem[]) => {
    setModifiedPkgs(prev => ({ ...prev, [pkgId]: items }));
  }, []);

  if (!p.form) return null;

  const isCotiza = p.proposalPath === 'cotiza';
  const isMenu = p.proposalPath === 'menu';
  const personas = p.form.personas || 1;

  const nudges = getNudgeTriggers({
    personas: p.form.personas,
    codigoPostal: p.form.codigoPostal,
    eventType: p.form.eventType,
    fechaInicio: p.form.fechaInicio,
  });

  const showNudge = nudges.length > 0;
  const nudgeMailto = showNudge
    ? buildNudgeMailto(p.form, nudges.map(n => n.reason).join('. '))
    : '';

  const showStaffSuggestion = shouldSuggestStaff(
    p.form.eventType,
    p.form.personas,
    p.form.duracionEstimada,
  );

  const hasDietary = p.form.tieneRestricciones && p.form.restriccionesDieteticas.length > 0;
  const dietaryLabels = hasDietary
    ? p.form.restriccionesDieteticas.map(r => {
        const map: Record<string, string> = {
          vegetariano: 'Vegetariano', vegano: 'Vegano', sin_gluten: 'Sin gluten',
          sin_lactosa: 'Sin lactosa', keto: 'Keto',
        };
        return map[r] || r;
      })
    : [];

  const earlyDelivery = p.form.horasEntrega?.[0] && p.form.horasEntrega[0] < '07:30';
  const volume80 = p.form.personas >= 80;
  const isSmallGroup = personas <= 6 && p.form.eventType !== 'capacitacion';
  const seasonalMsg = getSeasonalMessage(p.form.fechaInicio);

  // Calculate live totals for comparison row and floating bar
  const getPackageTotal = (pkgId: string) => {
    const items = modifiedPkgs[pkgId];
    const originalPkg = p.proposal?.packages.find(pk => pk.id === pkgId);
    if (!originalPkg) return 0;
    if (!items) return originalPkg.total;
    const itemsSubtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const sub = itemsSubtotal + originalPkg.deliveryFee;
    return roundCents(sub + calculateIVA(sub));
  };

  const anyModified = Object.keys(modifiedPkgs).length > 0;
  const esencialTotal = getPackageTotal('basico');
  const equilibradoTotal = getPackageTotal('recomendado');
  const experienciaTotal = getPackageTotal('premium');

  const diffEqVsEs = equilibradoTotal - esencialTotal;
  const diffExVsEq = experienciaTotal - equilibradoTotal;
  const pctEqVsEs = esencialTotal > 0 ? Math.round((diffEqVsEs / esencialTotal) * 100) : 0;
  const pctExVsEq = equilibradoTotal > 0 ? Math.round((diffExVsEq / equilibradoTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <BerliozHeader />

      <main className="flex-1 p-6 lg:p-10">
        {isCotiza && !p.proposal ? (
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
                Ciudad de México, {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="mt-4 space-y-1 text-sm text-foreground">
                <p><span className="text-muted-foreground">Atención:</span> {p.form.nombre}</p>
                <p><span className="text-muted-foreground">Empresa:</span> {p.form.empresa}</p>
                {isCotiza && (
                  <>
                    <p><span className="text-muted-foreground">Evento:</span> {EVENT_TYPE_LABELS[p.form.eventType as EventType]}</p>
                    <p><span className="text-muted-foreground">Fecha:</span> {p.form.fechaInicio}</p>
                    <p><span className="text-muted-foreground">Personas:</span> {p.form.personas}</p>
                    {p.form.codigoPostal && (
                      <p><span className="text-muted-foreground">CP:</span> {p.form.codigoPostal}</p>
                    )}
                    {p.form.duracionEstimada > 0 && (
                      <p><span className="text-muted-foreground">Duración:</span> {p.form.duracionEstimada}h</p>
                    )}
                    {p.form.tienePresupuesto && p.form.presupuestoPorPersona > 0 && (
                      <p><span className="text-muted-foreground">Presupuesto:</span> ${p.form.presupuestoPorPersona}/persona</p>
                    )}
                  </>
                )}
              </div>
              {isCotiza && p.proposal && (
                <p className="mt-6 text-foreground leading-relaxed">{p.proposal.intro}</p>
              )}

              {/* Seasonal message */}
              {seasonalMsg && (
                <div className="mt-4 px-4 py-3 rounded-lg border border-accent/30 bg-accent/5">
                  <p className="text-sm text-foreground">{seasonalMsg}</p>
                </div>
              )}

              {hasDietary && (
                <div className="mt-4 px-4 py-3 rounded-lg border border-accent/30 bg-accent/5">
                  <p className="text-sm text-foreground font-medium">
                    🥗 Cotización con opciones para: {dietaryLabels.join(', ')}
                  </p>
                  <a
                    href="https://berlioz.mx/vegano-vegetariano"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
                  >
                    Ver sección completa → berlioz.mx/vegano-vegetariano
                  </a>
                </div>
              )}
            </div>

            {isSmallGroup && (
              <div className="mb-6 px-4 py-3 rounded-lg border border-border bg-muted/50">
                <p className="text-sm text-foreground">
                  ¿Solo necesitas unas cuantas cajas? Ve directo →{' '}
                  <a href="https://berlioz.mx" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                    berlioz.mx
                  </a>
                </p>
              </div>
            )}

            {isCotiza && p.proposal && (
              <div
                className="mb-6 px-4 py-3 rounded-lg border-l-4 text-xs leading-relaxed"
                style={{ background: '#FDF3E0', borderColor: '#C9973A', borderRadius: 8 }}
              >
                {PRICE_DISCLAIMER_BANNER}
              </div>
            )}

            {/* Package cards */}
            {isCotiza && p.proposal && (
              <>
                <div className="proposal-packages grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {p.proposal.packages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      isRecommended={pkg.id === 'recomendado'}
                      onSelect={() => p.handlePackageSelect(pkg.displayName)}
                      earlyDeliverySurcharge={earlyDelivery}
                      volumeSurcharge={volume80}
                      people={personas}
                      onItemsChange={handleItemsChange}
                    />
                  ))}
                </div>

                {/* Comparison row */}
                <div className="mb-8 px-4 py-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Esencial vs Equilibrado:</span>
                    <span className="font-mono font-medium text-foreground">+{formatMXN(diffEqVsEs)} (+{pctEqVsEs}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equilibrado vs Experiencia:</span>
                    <span className="font-mono font-medium text-foreground">+{formatMXN(diffExVsEq)} (+{pctExVsEq}%)</span>
                  </div>
                </div>

                {p.proposal.recommendedReason && (
                  <p className="text-sm text-muted-foreground italic mb-8 text-center">
                    💡 {p.proposal.recommendedReason}
                  </p>
                )}
              </>
            )}

            {isMenu && p.cart.length > 0 && (
              <MenuProposal
                cart={p.cart}
                personas={personas}
                selectedAddons={p.selectedAddons}
                onSelect={(col) => p.handlePackageSelect(col === 'esencial' ? 'Esencial' : 'Plus +')}
              />
            )}

            {showStaffSuggestion && !p.selectedAddons.includes('personal_servicio') && (
              <div className="mt-6 mb-4 px-4 py-3 rounded-lg border border-accent/30 bg-accent/5">
                <p className="text-sm text-foreground font-medium">
                  👥 Para eventos de este tamaño, muchos clientes agregan personal de apoyo. ¿Te interesa?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  1-4 horas: $800/persona · 4-8 horas: $1,600/persona
                </p>
              </div>
            )}

            <AddonsBar selected={p.selectedAddons} onToggle={p.toggleAddon} personas={personas} />

            {p.addonLabels.length > 0 && (
              <div className="border border-accent/30 bg-accent/5 rounded-lg p-5 mt-8">
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">
                  Servicios adicionales solicitados
                </h3>
                <ul className="space-y-1.5">
                  {p.addonLabels.map((label, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-gold">✦</span><span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showNudge && (
              <div className="mt-8 px-5 py-4 rounded-xl" style={{ background: '#E8F0EB', border: '1px solid #1C3A2F', borderRadius: 12 }}>
                <p className="text-sm text-foreground font-semibold mb-1">💬 ¿Te ayudamos personalmente?</p>
                <p className="text-xs text-foreground mb-3">
                  Nuestro equipo te contacta en menos de 2 horas en horario hábil.
                </p>
                <a
                  href={nudgeMailto}
                  className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: '#1C3A2F', color: '#fff' }}
                >
                  Solicitar atención personalizada →
                </a>
              </div>
            )}

            {isCotiza && p.proposal && (
              <div className="border-t border-border pt-6 mb-8 mt-8">
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
            )}

            <div className="no-print sticky bottom-0 bg-background/90 backdrop-blur border-t border-border py-4 flex flex-wrap gap-3 justify-center mt-8">
              <button onClick={() => p.openGateDirectly('pdf')} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Descargar PDF
              </button>
              <button onClick={() => p.openGateDirectly('email')} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Enviar por email
              </button>
              <button onClick={p.navigateToWizard} className="px-5 py-2.5 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
                Modificar
              </button>
              <button
                onClick={() => p.openGateDirectly('select', 'Confirmar pedido')}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Confirmar pedido →
              </button>
            </div>

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

      {/* Floating bar when modified */}
      {anyModified && isCotiza && p.proposal && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-4 py-3 no-print">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>✏️ Propuesta personalizada ·</span>
              <span className="font-mono font-medium text-foreground">Esencial {formatMXN(esencialTotal)}</span>
              <span>·</span>
              <span className="font-mono font-medium text-foreground">Equilibrado {formatMXN(equilibradoTotal)}</span>
              <span>·</span>
              <span className="font-mono font-medium text-foreground">Experiencia {formatMXN(experienciaTotal)}</span>
            </div>
            <button
              onClick={() => p.openGateDirectly('pdf')}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shrink-0"
            >
              Descargar PDF →
            </button>
          </div>
        </div>
      )}

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
