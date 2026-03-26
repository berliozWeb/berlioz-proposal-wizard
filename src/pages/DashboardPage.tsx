import BaseLayout from "@/components/layout/BaseLayout";

const DashboardPage = () => (
  <BaseLayout>
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="font-heading text-3xl text-foreground mb-2">Dashboard</h1>
      <p className="font-body text-muted-foreground">Bienvenido a tu panel de gestión.</p>
    </div>
  </BaseLayout>
);

export default DashboardPage;