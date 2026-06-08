import { Gift } from "lucide-react";

interface Props {
  subtotal: number;
}

const T1 = 4500;
const T2 = 7000;
const T3 = 12000;

const GOLD = "#C8952A";
const GOLD_SOFT = "#F5E6C0";

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-MX");
}

const OrderRewardsProgress = ({ subtotal }: Props) => {
  const level = subtotal >= T3 ? 3 : subtotal >= T2 ? 2 : subtotal >= T1 ? 1 : 0;
  const pct = Math.min(100, (subtotal / T3) * 100);

  let title = "";
  let sub = "";
  if (subtotal <= 0) {
    title = "Agrega productos para desbloquear tus recompensas ✨";
    sub = "";
  } else if (level === 0) {
    title = `Estás a ${fmt(T1 - subtotal)} de recibir una Box de regalo 📦`;
    sub = "Nivel 1: 1 Box a elegir incluida en tu pedido";
  } else if (level === 1) {
    title = `¡Box incluida! ✅ — Te faltan ${fmt(T2 - subtotal)} para 2 Boxes de regalo`;
    sub = "Agrega un poco más y alcanza el Nivel 2";
  } else if (level === 2) {
    title = `¡2 Boxes incluidas! ✅ — Te faltan ${fmt(T3 - subtotal)} para el Set Colección`;
    sub = "Set Colección Berlioz · 3 Boxes";
  } else {
    title = "🏆 ¡Pedido VIP! Set Colección Berlioz incluido";
    sub = "Nuestro equipo se coordinará contigo para los detalles";
  }

  // Fill color
  let fillClass = "bg-muted-foreground/30";
  let fillStyle: React.CSSProperties = {};
  if (level === 1) fillClass = "bg-primary";
  else if (level === 2) fillClass = "bg-primary";
  else if (level === 3) {
    fillClass = "";
    fillStyle = { backgroundColor: GOLD };
  }

  const markers = [
    { pos: (T1 / T3) * 100, icon: "📦", amount: T1, reached: level >= 1 },
    { pos: (T2 / T3) * 100, icon: "📦📦", amount: T2, reached: level >= 2 },
    { pos: 100, icon: "🎁", amount: T3, reached: level >= 3 },
  ];

  const unlocked: string[] = [];
  if (level >= 1) unlocked.push("1 Box de regalo a elegir ✅");
  if (level >= 2) unlocked.push("2 Boxes de regalo distintas ✅");
  if (level >= 3) unlocked.push("Set Colección Berlioz · 3 Boxes ✅");

  const msgCardStyle: React.CSSProperties =
    level === 3 ? { backgroundColor: GOLD_SOFT } : {};
  const msgCardClass =
    level === 3 ? "rounded-lg p-3" : "rounded-lg bg-muted/40 p-3";
  const titleStyle: React.CSSProperties = level === 3 ? { color: GOLD } : {};

  return (
    <div className="space-y-3 pb-4 border-b border-border">
      <p className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Gift className="w-3 h-3" /> Recompensas de tu pedido
      </p>

      {/* Progress bar */}
      <div className="relative pt-1 pb-7">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
            style={{ width: `${pct}%`, ...fillStyle }}
          />
        </div>

        {/* Markers */}
        {markers.map((m, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${m.pos}%`, top: "14px" }}
          >
            <span
              className={`text-[10px] leading-none ${m.reached ? "" : "opacity-40"}`}
              style={m.reached && i === 2 ? { filter: "none" } : {}}
            >
              {m.icon}
            </span>
            <span
              className={`text-[9px] font-body font-semibold mt-0.5 ${m.reached ? "text-foreground" : "text-muted-foreground"}`}
              style={m.reached && i === 2 ? { color: GOLD } : {}}
            >
              {fmt(m.amount)}
            </span>
          </div>
        ))}
      </div>

      {/* Dynamic message card */}
      <div className={msgCardClass} style={msgCardStyle}>
        <p
          className="font-body text-xs font-semibold text-foreground leading-snug"
          style={titleStyle}
        >
          {title}
        </p>
        {sub && (
          <p
            className="font-body text-[11px] text-muted-foreground mt-0.5 leading-snug"
            style={level === 3 ? { color: GOLD } : {}}
          >
            {sub}
          </p>
        )}
      </div>

      {/* Unlocked list */}
      {unlocked.length > 0 && (
        <div className="rounded-lg p-2.5 space-y-1" style={{ backgroundColor: GOLD_SOFT }}>
          {unlocked.map((u, i) => (
            <p key={i} className="font-body text-[11px] font-medium" style={{ color: GOLD }}>
              {u}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderRewardsProgress;