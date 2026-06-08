import { useEffect, useState } from "react";
import { Gift, Check, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  subtotal: number;
}

const GIFT_BOX_OPTIONS = [
  "Pink Box",
  "Golden Box",
  "White Box",
  "Green Box",
  "Black Box",
  "Aqua Box",
  "Box Oriental",
  "Orzo Pasta Salad Box",
  "BLT Box",
  "Salad Box Pollo",
];

const STORAGE_KEY = "berlioz_reward_boxes";

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

  const [selected, setSelected] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);

  const maxPicks = level >= 3 ? 3 : level >= 2 ? 2 : level >= 1 ? 1 : 0;

  // Trim selection if user dropped to a lower level
  useEffect(() => {
    if (selected.length > maxPicks) {
      const trimmed = selected.slice(0, maxPicks);
      setSelected(trimmed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }, [maxPicks, selected]);

  const openPicker = () => {
    setDraft(selected);
    setDialogOpen(true);
  };

  const toggleDraft = (name: string) => {
    setDraft((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (maxPicks === 1) return [name];
      if (prev.length >= maxPicks) return prev;
      return [...prev, name];
    });
  };

  const confirmPick = () => {
    setSelected(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setDialogOpen(false);
  };

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
        <div className="rounded-lg p-2.5 space-y-2" style={{ backgroundColor: GOLD_SOFT }}>
          {unlocked.map((u, i) => (
            <p key={i} className="font-body text-[11px] font-medium" style={{ color: GOLD }}>
              {u}
            </p>
          ))}

          {maxPicks > 0 && level < 3 && (
            <button
              type="button"
              onClick={openPicker}
              className="w-full flex items-center justify-between gap-2 rounded-md bg-white/70 hover:bg-white px-2.5 py-2 transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="font-body text-[11px] font-semibold" style={{ color: GOLD }}>
                  {selected.length === 0
                    ? maxPicks === 1
                      ? "Elige tu Box de regalo →"
                      : `Elige tus ${maxPicks} Boxes →`
                    : `${selected.length}/${maxPicks} elegida${selected.length === 1 ? "" : "s"} · editar`}
                </p>
                {selected.length > 0 && (
                  <p className="font-body text-[10px] text-foreground/70 truncate">
                    {selected.join(" · ")}
                  </p>
                )}
              </div>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />
            </button>
          )}

          {level >= 3 && (
            <p className="font-body text-[11px]" style={{ color: GOLD }}>
              Nuestro equipo coordinará tu Set Colección contigo al confirmar el pedido.
            </p>
          )}
        </div>
      )}

      {/* Box picker dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {maxPicks === 1 ? "Elige tu Box de regalo" : `Elige tus ${maxPicks} Boxes de regalo`}
            </DialogTitle>
            <DialogDescription>
              {maxPicks === 1
                ? "Selecciona la Box que quieres recibir como regalo con tu pedido."
                : `Selecciona ${maxPicks} Boxes distintas. Te las incluimos sin costo.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {GIFT_BOX_OPTIONS.map((name) => {
              const isPicked = draft.includes(name);
              const disabled = !isPicked && draft.length >= maxPicks && maxPicks > 1;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDraft(name)}
                  disabled={disabled}
                  className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-left transition-colors ${
                    isPicked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span className="font-body text-sm font-medium text-foreground">{name}</span>
                  {isPicked && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmPick} disabled={draft.length === 0}>
              Confirmar selección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderRewardsProgress;