import BaseLayout from "@/components/layout/BaseLayout";

const OnboardingPage = () => (
  <BaseLayout hideFooter>
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <h1 className="font-heading text-3xl text-foreground mb-4">¡Bienvenido a Berlioz!</h1>
      <p className="font-body text-muted-foreground mb-8">Cuéntanos sobre tu empresa para personalizar tu experiencia.</p>
      <div className="rounded-xl border border-border bg-card p-8 text-muted-foreground font-body">
        Formulario de onboarding en construcción…
      </div>
    </div>
  </BaseLayout>
);

export default OnboardingPage;