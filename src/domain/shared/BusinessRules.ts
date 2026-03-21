export const BUSINESS_RULES = [
  'Cotización válida por 20 días naturales',
  'Precio especial de bags a partir de 30 piezas iguales',
  'Todos los pedidos deben pagarse antes de la entrega',
  'El pedido se realiza y paga en berlioz.mx',
  'Se recomienda solicitar entrega con 90 minutos de anticipación',
  'Desayunos desde 7:30am y comidas desde 10am — entregas antes de estos horarios tienen cargo de $290',
  'El costo de envío puede variar según código postal de entrega',
  'En compras de 80 piezas o más aplica cargo adicional por logística',
  'Berlioz entrega desde 4 personas',
  'Desayuno Berlioz y Comedor Berlioz: mínimo 20 piezas iguales',
  'Pedido promedio: 8-15 personas. Default sugerido: 10 personas',
];

export const PRICE_DISCLAIMER =
  '* Precios por persona del producto sin IVA (16%), costo de envío ($360/entrega) ni recargos por entrega temprana.';

export const AGENT_RULES = [
  'NUNCA inventar productos que no están en el catálogo',
  'NUNCA usar "café de especialidad" — no existe. El café es CAFÉ/TÉ BERLIOZ a $540 fijo',
  'Coffee Break AM/PM se cotiza por GRUPO (precio fijo), NO por persona',
  'DESAYUNO BERLIOZ y COMEDOR BERLIOZ: mínimo 20 piezas iguales',
  'BOX ECONÓMICAS: mínimo 20 piezas iguales',
  'PRECIO POR PERSONA = solo el producto, sin IVA, sin envío',
  'El envío es SIEMPRE adicional: $360/entrega base (Entrega 3)',
  'Si el pedido requiere cafetera con Coffee Break económico: doble envío ($720)',
  'Pedido promedio: 8-15 personas. Default sugerido: 10 personas',
  'Berlioz entrega DESDE 4 personas',
];

export const MEXICAN_HOLIDAYS = [
  '01-01', '02-03', '03-17', '05-01', '09-16', '11-17', '12-25',
];

export const DELIVERY_FEE_BASE = 360; // Entrega 3 — default
export const DOUBLE_DELIVERY_FEE = 720; // Coffee break con cafetera
export const EARLY_DELIVERY_SURCHARGE = 290;
export const PROPOSAL_VALIDITY_DAYS = 20;

// Snack cart threshold
export const SNACK_CART_MIN_PIECES = 300;

// ── CP coverage ──
export type CPCoverage = { type: 'cdmx' | 'outside'; message: string };

export function getCPCoverage(cp: string): CPCoverage | null {
  if (!cp || cp.length < 5) return null;
  const prefix = parseInt(cp.slice(0, 2), 10);
  if ((prefix >= 1 && prefix <= 16) || (prefix >= 52 && prefix <= 57)) {
    return { type: 'cdmx', message: '✓ Entregamos en tu zona' };
  }
  return {
    type: 'outside',
    message: '📦 Tu pedido es fuera de CDMX — sí entregamos en muchas ciudades. Para confirmar cobertura y costo especial: hola@berlioz.mx',
  };
}

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

  if (hourMX < 15) return null;

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

// Duration-based suggestions
export type DurationBlock = 'beverages_only' | 'beverages_snacks' | 'full_food' | 'full_day';

export function getDurationBlock(hours: number): DurationBlock {
  if (hours < 2) return 'beverages_only';
  if (hours <= 3) return 'beverages_snacks';
  if (hours <= 5) return 'full_food';
  return 'full_day'; // 5+ hours: desayuno + comida + coffee break
}

export function getDurationNote(hours: number): string | null {
  if (hours < 2) return 'Para juntas cortas, lo ideal es tener bebidas disponibles';
  if (hours <= 3) return '¿Quieres agregar un surtido dulce para el postre?';
  if (hours <= 5) return 'Tu junta es larga — ¿quieres agregar bebidas para antes o después de comer?';
  return 'Evento de día completo — incluimos desayuno, comida y coffee break';
}

// Budget tier multipliers
export function getBudgetTiers(budgetPerPerson: number) {
  return {
    adjusted: budgetPerPerson,
    recommended: budgetPerPerson * 1.2,
    complete: budgetPerPerson * 1.5,
  };
}

// Validate Mexican postal code
export function isValidMexicanCP(cp: string): boolean {
  return /^\d{5}$/.test(cp.trim());
}

// Staff pricing helper (uses real WooCommerce tiers)
export function getStaffRate(durationHours: number): number {
  if (durationHours <= 2) return 500;
  if (durationHours <= 4) return 800;
  return 1600;
}

// ── Time picker helpers ──
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 5; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();

export function calcSuggestedDelivery(eventTime: string): string {
  if (!eventTime) return '';
  const [h, m] = eventTime.split(':').map(Number);
  let totalMin = h * 60 + m - 90; // 90 min before
  if (totalMin < 300) totalMin = 300; // no earlier than 5:00am
  const dH = Math.floor(totalMin / 60);
  const dM = totalMin % 60;
  return `${String(dH).padStart(2, '0')}:${String(dM).padStart(2, '0')}`;
}

export function getTimeWarnings(deliveryTime: string, eventType: string, fechaInicio: string): string[] {
  if (!deliveryTime) return [];
  const warnings: string[] = [];
  const [h, m] = deliveryTime.split(':').map(Number);
  const totalMin = h * 60 + m;

  if (totalMin < 7 * 60 + 30) {
    warnings.push('Las entregas antes de las 7:30am tienen cargo adicional de $290');
  }
  if (eventType === 'comida' && totalMin < 10 * 60) {
    warnings.push('Las comidas antes de las 10am tienen cargo adicional de $290');
  }

  // Check cutoff for tomorrow
  const cutoff = getCutoffWarning(fechaInicio);
  if (cutoff?.type === 'yellow') {
    warnings.push('Tu pedido quedará sujeto a confirmación');
  }

  return warnings;
}

// Double delivery check for coffee break with cafetera
export function needsDoubleDelivery(eventType: string, personas: number): boolean {
  return eventType === 'coffee_break' && personas >= 30;
}
