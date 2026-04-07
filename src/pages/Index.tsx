import { useCallback } from "react";
import { Clock, CreditCard, MapPin } from "lucide-react";
import MinimalHeader from "@/components/landing/MinimalHeader";
import LeadCaptureSection from "@/components/landing/LeadCaptureSection";
import HeroCards from "@/components/landing/HeroCards";
import TopSellers from "@/components/landing/TopSellers";
import CategoryGrid from "@/components/landing/CategoryGrid";
import EventTypePills from "@/components/landing/EventTypePills";
import CotizaForm from "@/components/landing/CotizaForm";
import MenuBrowse from "@/components/landing/MenuBrowse";
import { useLandingPresenter } from "@/presentation/hooks/useLandingPresenter";

const TRUST_ITEMS = [
  { icon: Clock, label: 'Pide antes de las 3PM', sub: 'para el día siguiente' },
  { icon: CreditCard, label: 'Paga en línea', sub: 'compra mínima $1,000 MXN' },
  { icon: MapPin, label: 'Entrega a domicilio', sub: 'CDMX y Área Metropolitana' },
];

const TrustStrip = () => (
  <div className="max-w-3xl mx-auto px-6 animate-fade-in-up" style={{ paddingTop: 24, paddingBottom: 32 }}>
    <div
      className="grid grid-cols-3 divide-x"
      style={{
        border: '1px solid #E2D3CA',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.70)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
    >
      {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="flex flex-col items-center text-center py-4 px-3 gap-1.5">
          <Icon style={{ width: 16, height: 16, color: '#014D6F' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#014D6F', fontFamily: "'Montserrat', sans-serif", lineHeight: 1.3 }}>
            {label}
          </span>
          <span className="hidden sm:block" style={{ fontSize: 11, color: '#888888', fontFamily: "'Montserrat', sans-serif" }}>
            {sub}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const Index = () => {
  const p = useLandingPresenter();

  const isLeadComplete =
    p.state.nombre.trim().length >= 2 &&
    p.state.empresa.trim().length >= 2 &&
    p.state.celular.trim().length >= 2;

  const handleIncompleteClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const nombreInput = document.getElementById('lead-nombre-input') as HTMLInputElement | null;
      nombreInput?.focus();
      window.dispatchEvent(new CustomEvent('berlioz:shake-lead'));
    }, 300);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#FDFAF7' }}>
      <MinimalHeader />

      {p.state.path === 'landing' && (
        <>
          {/* Hero headline */}
          <section className="max-w-6xl mx-auto px-6 text-center" style={{ paddingTop: 64, paddingBottom: 8 }}>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', color: '#014D6F' }}>
              ¿Qué se te antoja hoy?
            </h1>
            <p className="mt-3" style={{ fontSize: 14, letterSpacing: '0.08em', color: '#014D6F', fontFamily: "'Montserrat', sans-serif" }}>
              Desayuno · Coffee Break · Working Lunch · Ciudad de México
            </p>
          </section>

          <LeadCaptureSection
            nombre={p.state.nombre}
            empresa={p.state.empresa}
            celular={p.state.celular}
            onUpdate={p.updateLead}
            isComplete={isLeadComplete}
          />

          <TrustStrip />

          <HeroCards
            onCotiza={p.goToCotiza}
            onMenu={p.goToMenu}
            isLeadComplete={isLeadComplete}
            onIncompleteClick={handleIncompleteClick}
          />
          <TopSellers
            onAdd={p.addToCart}
            onViewMenu={p.goToMenu}
            isLeadComplete={isLeadComplete}
            onIncompleteClick={handleIncompleteClick}
          />
          <CategoryGrid
            onSelect={(cat) => { p.setCategory(cat); p.goToMenu(); }}
            isLeadComplete={isLeadComplete}
            onIncompleteClick={handleIncompleteClick}
          />
        </>
      )}

      {p.state.path === 'cotiza' && (
        <main className="max-w-2xl mx-auto px-6 py-8">
          <EventTypePills
            selected={p.state.eventType}
            onSelect={p.selectEventType}
          />
          {p.state.eventType && (
            <CotizaForm
              form={p.state.wizardForm}
              onChange={p.setWizardForm}
              canSubmit={p.canSubmitCotiza}
              onSubmit={p.submitCotiza}
              onBack={p.goToLanding}
            />
          )}
          {!p.state.eventType && (
            <div className="text-center py-12">
              <p style={{ color: '#888888', fontFamily: "'Montserrat', sans-serif" }}>Selecciona un tipo de evento para continuar</p>
              <button
                type="button"
                onClick={p.goToLanding}
                className="mt-4 hover:underline"
                style={{ fontSize: 14, color: '#014D6F', fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
              >
                ← Volver al inicio
              </button>
            </div>
          )}
        </main>
      )}

      {p.state.path === 'menu' && (
        <MenuBrowse
          activeCategory={p.state.activeCategory}
          onSelectCategory={p.setCategory}
          onAdd={p.addToCart}
          cartCount={p.cartCount}
          cartTotal={p.cartTotal}
          onCheckout={p.submitMenu}
          onBack={p.goToLanding}
        />
      )}
    </div>
  );
};

export default Index;
