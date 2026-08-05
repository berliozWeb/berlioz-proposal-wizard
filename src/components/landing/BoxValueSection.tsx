import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  ClipboardCheck,
  FileText,
  Sprout,
  Users,
  Building2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import boxAsset from "@/assets/berlioz-box-crema.png.asset.json";

const NAVY = "#014D6F";
const CREAM = "#FDFAF7";
const MONT = "'Montserrat', sans-serif";
const ORDER_ROUTE = "/menu";

interface Tag {
  id: string;
  icon: LucideIcon;
  label: string;
  body: string;
}

const LEFT_TAGS: Tag[] = [
  {
    id: "empaques",
    icon: Leaf,
    label: "Empaques y cubiertos biodegradables",
    body: "Cuidamos el planeta tanto como a tu equipo: empaques 100% biodegradables y cubiertos compostables en cada pedido.",
  },
  {
    id: "ingredientes",
    icon: ClipboardCheck,
    label: "Ingredientes cuidadosamente seleccionados",
    body: "Desde 2015 perfeccionando recetas franco-mexicanas con ingredientes frescos, seleccionados uno a uno.",
  },
  {
    id: "facturacion",
    icon: FileText,
    label: "Autofacturación",
    body: "Factura tu pedido en minutos desde nuestro portal, sin correos ni esperas.",
  },
];

const RIGHT_TAGS: Tag[] = [
  {
    id: "dietas",
    icon: Sprout,
    label: "Opciones vegetarianas, veganas, sin gluten y sin lactosa",
    body: "Menús para todos: cada persona de tu equipo encuentra algo delicioso, sin sacrificar sabor.",
  },
  {
    id: "adapta",
    icon: Users,
    label: "Menú que se adapta a tu junta o evento",
    body: "Desde un coffee break íntimo hasta el evento del año: armamos el menú alrededor de tu ocasión.",
  },
  {
    id: "masivos",
    icon: Building2,
    label: "Opciones para eventos masivos",
    body: "¿100, 500, 1,000 personas? Producción y logística probadas con empresas como EY, DHL y PepsiCo.",
  },
];

const ALL_TAGS = [...LEFT_TAGS, ...RIGHT_TAGS];

/** Posiciones de los hotspots sobre la foto (desktop) */
const LEFT_POS = [
  { top: "8%", left: "0%" },
  { top: "34%", left: "0%" },
  { top: "58%", left: "2%" },
];

const RIGHT_POS = [
  { top: "16%", right: "0%" },
  { top: "42%", right: "0%" },
  { top: "68%", right: "1%" },
];

const OrderCTA = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-opacity hover:opacity-85"
    style={{ background: NAVY, color: CREAM, fontFamily: MONT, fontWeight: 600, fontSize: 13 }}
  >
    Hacer pedido
    <ArrowRight style={{ width: 14, height: 14 }} />
  </button>
);

const BoxValueSection = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-box-tag]")) setOpen(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const goOrder = () => navigate(ORDER_ROUTE);

  const renderTag = (
    tag: Tag,
    index: number,
    side: "left" | "right",
    floating = false,
  ) => {
    const Icon = tag.icon;
    const isOpen = open === tag.id;
    return (
      <div
        key={tag.id}
        data-box-tag
        className="relative transition-all duration-500"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transitionDelay: `${index * 90 + (side === "right" ? 120 : 0)}ms`,
          zIndex: isOpen ? 30 : 10,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(isOpen ? null : tag.id)}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-transform duration-200 hover:-translate-y-0.5"
          style={{
            background: "#F4E9DE",
            boxShadow: isOpen
              ? "0 10px 28px rgba(60,40,20,0.20)"
              : "0 6px 18px rgba(60,40,20,0.12)",
            backdropFilter: "blur(2px)",
          }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, background: "#EADCCD", flexShrink: 0 }}
          >
            <Icon style={{ width: 18, height: 18, color: NAVY }} strokeWidth={1.5} />
          </span>
          <span
            style={{
              fontFamily: MONT,
              fontWeight: 500,
              fontSize: 13,
              color: NAVY,
              lineHeight: 1.3,
            }}
          >
            {tag.label}
          </span>
        </button>

        {isOpen && (
          <div
            className={`mt-2 rounded-2xl p-4 animate-fade-in ${floating ? "absolute top-full w-[300px]" : ""}`}
            style={{
              background: "#FBF4EC",
              boxShadow: "0 14px 34px rgba(60,40,20,0.22)",
              ...(floating ? (side === "left" ? { left: 0 } : { right: 0 }) : {}),
            }}
          >
            <p
              className="mb-2 text-sm"
              style={{ fontFamily: MONT, fontWeight: 700, color: NAVY }}
            >
              {tag.label}
            </p>
            <p
              className="mb-4 text-sm"
              style={{ fontFamily: MONT, color: "#5B6B72", lineHeight: 1.5 }}
            >
              {tag.body}
            </p>
            <OrderCTA onClick={goOrder} />
          </div>
        )}
      </div>
    );
  };

  return (
    <section ref={sectionRef} className="py-5 md:py-6" style={{ background: CREAM }}>
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        <h2
          className="text-center"
          style={{ fontFamily: MONT, fontWeight: 700, fontSize: 26, color: NAVY, lineHeight: 1.1 }}
        >
          ¿Por qué BERLIOZ?
        </h2>

        {/* Desktop: hotspots flotando encima de la foto */}
        <div className="relative mx-auto mt-3 hidden w-full lg:block">
          <img
            src={boxAsset.url}
            alt="Box Berlioz con pasta, postre, ensalada y bebida artesanal sobre fondo crema"
            className="w-full"
            loading="lazy"
          />

          {LEFT_TAGS.map((t, i) => (
            <div
              key={t.id}
              className="absolute w-[220px]"
              style={{ top: LEFT_POS[i].top, left: LEFT_POS[i].left }}
            >
              {renderTag(t, i, "left", true)}
            </div>
          ))}

          {RIGHT_TAGS.map((t, i) => (
            <div
              key={t.id}
              className="absolute w-[232px]"
              style={{ top: RIGHT_POS[i].top, right: RIGHT_POS[i].right }}
            >
              {renderTag(t, i, "right", true)}
            </div>
          ))}
        </div>

        {/* Móvil: imagen arriba, acordeón debajo */}
        <div className="mt-4 lg:hidden">
          <img
            src={boxAsset.url}
            alt="Box Berlioz con pasta, postre, ensalada y bebida artesanal sobre fondo crema"
            className="w-full"
            loading="lazy"
          />
          <div className="mt-4 flex flex-col gap-3">
            {ALL_TAGS.map((t, i) => renderTag(t, i, "left"))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoxValueSection;