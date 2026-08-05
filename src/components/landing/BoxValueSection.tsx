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

  const renderTag = (tag: Tag, index: number, side: "left" | "right") => {
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
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(isOpen ? null : tag.id)}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-transform duration-200 hover:-translate-y-0.5"
          style={{
            background: "#FFFDFB",
            border: "1px solid #E8DDD5",
            boxShadow: isOpen
              ? "0 8px 24px rgba(1,77,111,0.14)"
              : "0 2px 8px rgba(1,77,111,0.07)",
          }}
        >
          <Icon style={{ width: 20, height: 20, color: NAVY, flexShrink: 0 }} strokeWidth={1.5} />
          <span
            className="text-sm"
            style={{ fontFamily: MONT, fontWeight: 500, color: NAVY, lineHeight: 1.35 }}
          >
            {tag.label}
          </span>
        </button>

        {isOpen && (
          <div
            className="z-20 mt-2 rounded-xl p-4 animate-fade-in lg:absolute lg:top-full lg:w-[300px]"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8DDD5",
              boxShadow: "0 12px 32px rgba(1,77,111,0.16)",
              ...(side === "left" ? { left: 0 } : { right: 0 }),
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
    <section ref={sectionRef} className="py-16 md:py-24" style={{ background: CREAM }}>
      <div className="mx-auto max-w-6xl px-6">
        <h2
          className="text-center"
          style={{ fontFamily: MONT, fontWeight: 700, fontSize: 36, color: NAVY, lineHeight: 1.15 }}
        >
          Una Box, todo resuelto
        </h2>
        <p
          className="mt-2 text-center text-sm"
          style={{ fontFamily: MONT, color: "#8A8A8A" }}
        >
          Así se ve un pedido Berlioz
        </p>

        {/* Desktop: tags flotando a los lados */}
        <div className="mt-10 hidden items-center gap-0 lg:grid lg:grid-cols-[minmax(0,250px)_minmax(0,1fr)_minmax(0,250px)]">
          <div className="flex flex-col gap-14" style={{ transform: "translateX(28px)" }}>
            {LEFT_TAGS.map((t, i) => renderTag(t, i, "left"))}
          </div>

          <div className="px-2">
            <img
              src={boxAsset.url}
              alt="Box Berlioz con pasta, postre, ensalada y bebida artesanal sobre fondo crema"
              className="w-full"
              loading="lazy"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
                maskImage:
                  "radial-gradient(ellipse at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
              }}
            />
          </div>

          <div className="flex flex-col gap-14" style={{ transform: "translateX(-28px)" }}>
            {RIGHT_TAGS.map((t, i) => renderTag(t, i, "right"))}
          </div>
        </div>

        {/* Móvil: imagen arriba, acordeón debajo */}
        <div className="mt-8 lg:hidden">
          <img
            src={boxAsset.url}
            alt="Box Berlioz con pasta, postre, ensalada y bebida artesanal sobre fondo crema"
            className="w-full"
            loading="lazy"
          />
          <div className="mt-6 flex flex-col gap-3">
            {ALL_TAGS.map((t, i) => renderTag(t, i, "left"))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoxValueSection;