import MinimalHeader from "@/components/landing/MinimalHeader";
import HeroCards from "@/components/landing/HeroCards";
import TopSellers from "@/components/landing/TopSellers";
import CategoryGrid from "@/components/landing/CategoryGrid";
import EventTypePills from "@/components/landing/EventTypePills";
import CotizaForm from "@/components/landing/CotizaForm";
import MenuBrowse from "@/components/landing/MenuBrowse";
import { useLandingPresenter } from "@/presentation/hooks/useLandingPresenter";

const Index = () => {
  const p = useLandingPresenter();

  return (
    <div className="min-h-screen bg-background">
      <MinimalHeader
        nombre={p.state.nombre}
        empresa={p.state.empresa}
        celular={p.state.celular}
        onUpdate={p.updateLead}
      />

      {p.state.path === 'landing' && (
        <>
          <HeroCards onCotiza={p.goToCotiza} onMenu={p.goToMenu} />
          <TopSellers onAdd={p.addToCart} onViewMenu={p.goToMenu} />
          <CategoryGrid onSelect={(cat) => { p.setCategory(cat); p.goToMenu(); }} />
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
              <p className="text-muted-foreground">Selecciona un tipo de evento para continuar</p>
              <button
                type="button"
                onClick={p.goToLanding}
                className="mt-4 text-sm text-primary font-medium hover:underline"
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
