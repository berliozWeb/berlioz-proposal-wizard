import BaseLayout from "@/components/layout/BaseLayout";

const ConfirmationPage = () => (
  <BaseLayout>
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">✓</span>
      </div>
      <h1 className="font-heading text-3xl text-foreground mb-4">¡Pedido confirmado!</h1>
      <p className="font-body text-muted-foreground">Recibirás un correo con los detalles de tu pedido.</p>
    </div>
  </BaseLayout>
);

export default ConfirmationPage;