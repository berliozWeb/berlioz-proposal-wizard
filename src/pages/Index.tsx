import MinimalHeader from "@/components/landing/MinimalHeader";
import LeadCaptureSection from "@/components/landing/LeadCaptureSection";
import HeroCards from "@/components/landing/HeroCards";
import TopSellers from "@/components/landing/TopSellers";
import CategoryGrid from "@/components/landing/CategoryGrid";
import EventTypePills from "@/components/landing/EventTypePills";
import CotizaForm from "@/components/landing/CotizaForm";
import MenuBrowse from "@/components/landing/MenuBrowse";
import { useLandingPresenter } from "@/presentation/hooks/useLandingPresenter";

const Index = () => {
  const p = useLandingPresenter();

  const isLeadComplete =
    p.state.nombre.trim().length >= 2 &&
    p.state.empresa.trim().length >= 2 &&
    p.state.celular.trim().length >= 2;

  return (
    <div className="min-h-screen bg-background">
      <MinimalHeader />

      {p.state.path === 'landing' && (
        <>
          {/* Hero headline */}
          <section className="max-w-6xl mx-auto px-6 text-center" style={{ paddingTop: 64, paddingBottom: 8 }}>
            <h1
              className="font-heading font-bold"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', color: '#1C3A2F' }}
            >
              ¿Qué se te antoja hoy?
            </h1>
            <p className="font-body mt-4" style={{ fontSize: 16, color: '#C9973A', letterSpacing: '0.08em' }}>
              Desayuno · Coffee Break · Working Lunch · Ciudad de México
            </p>
          </section>

          {/* Lead capture */}
          <LeadCaptureSection
            nombre={p.state.nombre}
            empresa={p.state.empresa}
            celular={p.state.celular}
            onUpdate={p.updateLead}
            isComplete={isLeadComplete}
          />

          {/* Entry points — no opacity dimming, only pointer-events gate */}
          <div
            id="entry-points"
            className="transition-all duration-400 ease-in-out"
            style={{
              pointerEvents: isLeadComplete ? 'auto' : 'none',
              cursor: isLeadComplete ? undefined : 'not-allowed',
            }}
          >
            <HeroCards onCotiza={p.goToCotiza} onMenu={p.goToMenu} />
            <TopSellers onAdd={p.addToCart} onViewMenu={p.goToMenu} />
          </div>
          <div
            className="transition-all duration-400 ease-in-out"
            style={{
              pointerEvents: isLeadComplete ? 'auto' : 'none',
              cursor: isLeadComplete ? undefined : 'not-allowed',
            }}
          >
            <CategoryGrid onSelect={(cat) => { p.setCategory(cat); p.goToMenu(); }} />
          </div>
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
              <p className="text-muted-foreground font-body">Selecciona un tipo de evento para continuar</p>
              <button
                type="button"
                onClick={p.goToLanding}
                className="mt-4 font-body font-medium hover:underline"
                style={{ fontSize: 14, color: '#C9973A' }}
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
