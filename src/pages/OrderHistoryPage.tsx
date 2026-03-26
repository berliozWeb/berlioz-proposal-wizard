import BaseLayout from "@/components/layout/BaseLayout";

const OrderHistoryPage = () => (
  <BaseLayout>
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="font-heading text-3xl text-foreground mb-2">Historial de pedidos</h1>
      <p className="font-body text-muted-foreground">Aquí verás todos tus pedidos anteriores.</p>
    </div>
  </BaseLayout>
);

export default OrderHistoryPage;