import BaseLayout from "@/components/layout/BaseLayout";

const HomePage = () => (
  <BaseLayout>
    {/* Hero section - will be built out */}
    <section className="relative min-h-[80vh] flex items-center justify-center bg-primary">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="font-heading text-5xl md:text-7xl text-primary-foreground mb-6">
          Catering que inspira
        </h1>
        <p className="font-body text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
          Desayunos, coffee breaks y working lunches premium para empresas en Ciudad de México.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/menu" className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-card text-primary font-body font-semibold text-sm hover:bg-card/90 transition-colors">
            Ver menú
          </a>
          <a href="/cotizar" className="inline-flex items-center justify-center h-12 px-8 rounded-lg border-2 border-primary-foreground text-primary-foreground font-body font-semibold text-sm hover:bg-primary-foreground/10 transition-colors">
            Cotizar evento
          </a>
        </div>
      </div>
    </section>
  </BaseLayout>
);

export default HomePage;