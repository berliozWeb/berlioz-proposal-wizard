import { useLocation } from "react-router-dom";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { analytics } from "@/lib/mixpanel";

const WHATSAPP_FAB_URL =
  "https://wa.me/5215582375469?text=" +
  encodeURIComponent("¡Hola! Quiero ayuda para hacer mi pedido o cotizar");

/** Rutas privadas / de compra donde no queremos el botón flotante. */
const HIDDEN_PREFIXES = ["/admin", "/dashboard", "/checkout", "/login"];

const WhatsAppFab = () => {
  const location = useLocation();
  const hidden = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));
  if (hidden) return null;

  return (
    <a
      href={WHATSAPP_FAB_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => analytics.track("whatsapp_click", { page: location.pathname })}
      aria-label="Escríbenos por WhatsApp"
      className="md:hidden fixed right-4 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform"
      style={{ background: "#25D366" }}
    >
      <WhatsAppIcon size={28} color="#FFFFFF" />
    </a>
  );
};

export default WhatsAppFab;
