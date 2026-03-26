import BaseLayout from "@/components/layout/BaseLayout";
import { useCart } from "@/contexts/CartContext";

const CheckoutPage = () => {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <BaseLayout>
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <h1 className="font-heading text-3xl text-foreground mb-4">Tu carrito está vacío</h1>
          <p className="font-body text-muted-foreground mb-6">Agrega productos desde el menú para continuar.</p>
          <a
            href="/menu"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Explorar menú
          </a>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-heading text-3xl text-foreground mb-6">Checkout</h1>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="font-body text-muted-foreground">
            {items.length} producto{items.length > 1 ? "s" : ""} · Subtotal: ${subtotal.toLocaleString("es-MX")}
          </p>
        </div>
      </div>
    </BaseLayout>
  );
};

export default CheckoutPage;