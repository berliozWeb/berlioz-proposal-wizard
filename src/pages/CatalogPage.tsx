import BaseLayout from "@/components/layout/BaseLayout";

const CatalogPage = () => (
  <BaseLayout>
    <div className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="font-heading text-4xl text-foreground mb-2">Nuestro Menú</h1>
      <p className="font-body text-muted-foreground mb-10">Explora toda nuestra oferta de catering corporativo.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ProductCards will be populated here */}
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground font-body">
          Catálogo en construcción…
        </div>
      </div>
    </div>
  </BaseLayout>
);

export default CatalogPage;