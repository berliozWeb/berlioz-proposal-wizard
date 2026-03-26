import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BaseLayout from "@/components/layout/BaseLayout";
import StepperProgress from "@/components/ui/StepperProgress";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import CheckoutStep1Cart from "@/components/checkout/CheckoutStep1Cart";
import CheckoutStep2Delivery from "@/components/checkout/CheckoutStep2Delivery";
import CheckoutStep3Payment from "@/components/checkout/CheckoutStep3Payment";
import CheckoutStep4Confirmation from "@/components/checkout/CheckoutStep4Confirmation";

const STEPS = [
  { label: "Carrito" },
  { label: "Entrega" },
  { label: "Pago" },
  { label: "Confirmación" },
];

const CheckoutPage = () => {
  const { items } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(() => {
    return sessionStorage.getItem("berlioz_last_order_id");
  });

  // If we have a stored order and are on step 4, stay there
  useEffect(() => {
    if (orderId) setStep(3);
  }, [orderId]);

  // Redirect if cart is empty and not on confirmation
  useEffect(() => {
    if (items.length === 0 && step < 3 && !orderId) {
      navigate("/menu");
    }
  }, [items.length, step, orderId, navigate]);

  const handleOrderComplete = useCallback((newOrderId: string) => {
    sessionStorage.setItem("berlioz_last_order_id", newOrderId);
    setOrderId(newOrderId);
    setStep(3);
  }, []);

  if (items.length === 0 && step < 3 && !orderId) return null;

  return (
    <BaseLayout>
      <StepperProgress steps={STEPS} currentStep={step} />
      <div className="min-h-[calc(100vh-200px)]">
        {step === 0 && <CheckoutStep1Cart onNext={() => setStep(1)} />}
        {step === 1 && <CheckoutStep2Delivery onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <CheckoutStep3Payment onNext={handleOrderComplete} onBack={() => setStep(1)} />}
        {step === 3 && <CheckoutStep4Confirmation orderId={orderId} />}
      </div>
    </BaseLayout>
  );
};

export default CheckoutPage;
