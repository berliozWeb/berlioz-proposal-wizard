import BaseLayout from "@/components/layout/BaseLayout";

const QuotesPage = () => (
  <BaseLayout>
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="font-heading text-3xl text-foreground mb-2">Mis cotizaciones</h1>
      <p className="font-body text-muted-foreground">Revisa y gestiona las cotizaciones de tus clientes.</p>
    </div>
  </BaseLayout>
);

export default QuotesPage;