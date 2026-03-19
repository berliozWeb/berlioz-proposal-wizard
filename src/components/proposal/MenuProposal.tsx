import type { CartItem } from "@/domain/entities/MenuItem";
import type { Addon } from "@/domain/entities/Addon";
import { ADDONS } from "@/domain/entities/Addon";
import { formatMXN, calculateIVA, roundCents } from "@/domain/value-objects/Money";
import { cn } from "@/lib/utils";

interface MenuProposalProps {
  cart: CartItem[];
  personas: number;
  selectedAddons: string[];
  onSelect: (column: 'esencial' | 'plus') => void;
}

function computeColumn(
  cart: CartItem[],
  personas: number,
  addons: Addon[],
  isPlus: boolean,
) {
  let subtotal = cart.reduce((s, c) => s + c.menuItem.pricePerPerson * c.quantity, 0) * personas;

  // Plus adds suggested upgrades
  const plusExtras: { name: string; price: number }[] = [];
  if (isPlus) {
    plusExtras.push({ name: 'Café y bebidas ilimitadas', price: 250 * personas });
    plusExtras.push({ name: 'Surtido de snacks', price: 100 * personas });
    subtotal += plusExtras.reduce((s, e) => s + e.price, 0);
  }

  // Add addons
  const addonTotal = addons.reduce((s, a) => s + (a.pricePerPerson || 0) * personas, 0);
  subtotal += addonTotal;

  const iva = calculateIVA(subtotal);
  const total = roundCents(subtotal + iva);

  return { subtotal, iva, total, plusExtras, pricePerPerson: roundCents(total / Math.max(1, personas)) };
}

const MenuProposal = ({ cart, personas, selectedAddons, onSelect }: MenuProposalProps) => {
  const activeAddons = ADDONS.filter((a) => selectedAddons.includes(a.id));
  const esencial = computeColumn(cart, personas, activeAddons, false);
  const plus = computeColumn(cart, personas, activeAddons, true);
  const priceDiff = roundCents(plus.pricePerPerson - esencial.pricePerPerson);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Esencial */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-heading text-xl font-bold text-foreground mb-1">Esencial</h3>
        <p className="text-xs text-muted-foreground mb-4">Exactamente lo que seleccionaste</p>

        <ul className="space-y-2 mb-6">
          {cart.map((c) => (
            <li key={c.menuItem.id} className="flex justify-between text-sm">
              <span className="text-foreground">{c.menuItem.name} ×{c.quantity}</span>
              <span className="font-mono text-muted-foreground">{formatMXN(c.menuItem.pricePerPerson * c.quantity * personas)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{formatMXN(esencial.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span className="font-mono">{formatMXN(esencial.iva)}</span></div>
          <div className="flex justify-between font-semibold text-base pt-1"><span>Total</span><span className="font-mono">{formatMXN(esencial.total)}</span></div>
        </div>

        <button
          type="button"
          onClick={() => onSelect('esencial')}
          className="mt-5 w-full py-3 rounded-lg border border-border text-foreground font-body text-sm font-semibold hover:bg-muted transition-colors"
        >
          Seleccionar Esencial
        </button>
      </div>

      {/* Plus */}
      <div className="rounded-xl border-2 border-primary bg-card p-6 relative">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
          ⭐ Más popular
        </span>
        <h3 className="font-heading text-xl font-bold text-foreground mb-1">Plus +</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Tu selección + upgrades sugeridos
          <span className="text-primary font-medium ml-1">+{formatMXN(priceDiff)} más/persona</span>
        </p>

        <ul className="space-y-2 mb-3">
          {cart.map((c) => (
            <li key={c.menuItem.id} className="flex justify-between text-sm">
              <span className="text-foreground">{c.menuItem.name} ×{c.quantity}</span>
              <span className="font-mono text-muted-foreground">{formatMXN(c.menuItem.pricePerPerson * c.quantity * personas)}</span>
            </li>
          ))}
        </ul>

        {plus.plusExtras.length > 0 && (
          <div className="bg-primary/5 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-primary mb-1.5">+ Upgrades incluidos:</p>
            {plus.plusExtras.map((e) => (
              <div key={e.name} className="flex justify-between text-sm">
                <span className="text-foreground">+ {e.name}</span>
                <span className="font-mono text-muted-foreground">{formatMXN(e.price)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{formatMXN(plus.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span className="font-mono">{formatMXN(plus.iva)}</span></div>
          <div className="flex justify-between font-semibold text-base pt-1"><span>Total</span><span className="font-mono">{formatMXN(plus.total)}</span></div>
        </div>

        <button
          type="button"
          onClick={() => onSelect('plus')}
          className="mt-5 w-full py-3 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Seleccionar Plus + →
        </button>
      </div>
    </div>
  );
};

export default MenuProposal;
