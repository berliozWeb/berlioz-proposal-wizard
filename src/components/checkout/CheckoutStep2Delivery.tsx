import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/** Legacy step component — checkout is now a single-page form at /checkout */
const CheckoutStep2Delivery = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="text-center py-20">
      <p className="font-body text-muted-foreground mb-4">Este paso se ha integrado en el nuevo checkout.</p>
      <Button onClick={() => navigate("/checkout")}>Ir al checkout</Button>
    </div>
  );
};

export default CheckoutStep2Delivery;
