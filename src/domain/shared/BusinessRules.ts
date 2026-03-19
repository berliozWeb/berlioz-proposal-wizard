export const BUSINESS_RULES = [
  'Cotización válida por 20 días naturales',
  'Precio especial de bags a partir de 30 piezas iguales',
  'Todos los pedidos deben pagarse antes de la entrega',
  'El pedido se realiza y paga en berlioz.mx',
  'Se recomienda solicitar entrega con 90 minutos de anticipación',
  'Desayunos desde 7:30am y comidas desde 10am — entregas antes de estos horarios tienen cargo de $290',
  'El costo de envío puede variar según código postal de entrega',
  'En compras de 80 piezas o más aplica cargo adicional por logística',
];

export const PRICE_DISCLAIMER =
  '* Precios sin IVA (16%), costo de envío ni recargos por entrega temprana. El total final se calcula al confirmar.';

export const MEXICAN_HOLIDAYS = [
  '01-01', '02-03', '03-17', '05-01', '09-16', '11-17', '12-25',
];

export const DELIVERY_FEE_PER_TRIP = 360;
export const PROPOSAL_VALIDITY_DAYS = 20;

// Rule 4: Logo add-on
export const LOGO_PRICE_PER_BOX = 26;

// Rule 4: Snack cart threshold
export const SNACK_CART_MIN_PIECES = 300;

// Rule 5: Service staff pricing
export const STAFF_PRICE_SHORT = 800;   // 1–4 hours
export const STAFF_PRICE_LONG = 1600;   // 4–8 hours

export function getDateDisclaimer(dateStr: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  const mmdd = dateStr.slice(5);

  if (day === 0 || MEXICAN_HOLIDAYS.includes(mmdd)) {
    return '📌 Domingos y días festivos el pedido mínimo es $5,000 + IVA';
  }
  if (day === 6) {
    return '📌 Los sábados el pedido mínimo es $3,000 + IVA';
  }
  return null;
}

export function getDeliveryCount(
  esMultiDia: boolean,
  entregasPorDia: string[],
  horasEntrega: string[],
  fechaInicio: string,
  fechaFin?: string,
): number {
  if (esMultiDia) {
    const dayCount = getDayCount(fechaInicio, fechaFin);
    return Math.max(1, entregasPorDia.length) * dayCount;
  }
  return horasEntrega.length || 1;
}

export function getDayCount(fechaInicio: string, fechaFin?: string): number {
  if (!fechaInicio || !fechaFin) return 1;
  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

// Rule 6: Cutoff time logic
export type CutoffWarning = {
  type: 'yellow' | 'red';
  message: string;
  blockSubmit: boolean;
};

export function getCutoffWarning(dateStr: string): CutoffWarning | null {
  if (!dateStr) return null;

  const nowMX = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }),
  );
  const hourMX = nowMX.getHours();

  if (hourMX < 15) return null; // before 3pm → no warning

  const today = new Date(nowMX.getFullYear(), nowMX.getMonth(), nowMX.getDate());
  const selected = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round(
    (selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) {
    return {
      type: 'red',
      message:
        '⚠️ Lo sentimos, no es posible procesar pedidos para hoy después de las 3pm. Por favor selecciona otra fecha o contáctanos directamente a hola@berlioz.mx',
      blockSubmit: true,
    };
  }
  if (diffDays === 1) {
    return {
      type: 'yellow',
      message:
        '⚠️ Los pedidos para mañana recibidos después de las 3pm quedan sujetos a confirmación por parte de nuestro equipo. Te contactaremos a la brevedad.',
      blockSubmit: false,
    };
  }
  return null;
}

// Rule 3: Duration-based suggestions
export type DurationBlock = 'beverages_only' | 'beverages_snacks' | 'full_food';

export function getDurationBlock(hours: number): DurationBlock {
  if (hours < 2) return 'beverages_only';
  if (hours <= 3) return 'beverages_snacks';
  return 'full_food';
}

export function getDurationNote(hours: number): string | null {
  if (hours < 2) return 'Para eventos cortos recomendamos solo bebidas';
  return null;
}

// Rule 2: Budget tier multipliers
export function getBudgetTiers(budgetPerPerson: number) {
  return {
    adjusted: budgetPerPerson,               // at or below
    recommended: budgetPerPerson * 1.2,       // 15-25% above
    complete: budgetPerPerson * 1.5,          // 40-60% above
  };
}

// Validate Mexican postal code (5 digits)
export function isValidMexicanCP(cp: string): boolean {
  return /^\d{5}$/.test(cp.trim());
}

// Rule 5: staff pricing helper
export function getStaffRate(durationHours: number): number {
  return durationHours <= 4 ? STAFF_PRICE_SHORT : STAFF_PRICE_LONG;
}
