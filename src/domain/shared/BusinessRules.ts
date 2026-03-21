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
  'Comedor Berlioz: mínimo 10 piezas iguales',
  'Box Económica (1, 2, 3): mínimo 20 piezas iguales',
  'Mini Box ($170): sin mínimo',
  'Pedido promedio: 8-15 personas. Default sugerido: 10 personas',
  'Personal de apoyo: distribución de alimentos. No incluye servicio de meseros formales.',
];

export const PRICE_DISCLAIMER =
  '* Precios por persona del producto sin IVA (16%), costo de envío ($360/entrega) ni recargos por entrega temprana.';

export const PRICE_DISCLAIMER_BANNER =
  'ℹ️ Precios por persona del producto únicamente. Se agregan al total: IVA 16% · Envío $360/entrega · Recargo entrega temprana $290 si aplica.';

export const AGENT_RULES = [
  'NUNCA inventar productos que no están en el catálogo',
  'NUNCA usar "café de especialidad" — no existe. El café es CAFÉ/TÉ BERLIOZ a $540 fijo',
  'Coffee Break AM/PM se cotiza por GRUPO (precio fijo), NO por persona',
  'COMEDOR BERLIOZ: mínimo 10 piezas iguales',
  'BOX ECONÓMICAS: mínimo 20 piezas iguales',
  'MINI BOX: sin mínimo — disponible para cualquier grupo',
  'PRECIO POR PERSONA = solo el producto, sin IVA, sin envío',
  'El envío es SIEMPRE adicional: $360/entrega base (Entrega 3)',
  'Si el pedido requiere cafetera con Coffee Break económico: doble envío ($720)',
  'Pedido promedio: 8-15 personas. Default sugerido: 10 personas',
  'Berlioz entrega DESDE 4 personas',
];

// ── Product minimums ──
export const PRODUCT_MINIMUMS: Record<string, number> = {
  comedor: 10,
  box_eco_1: 20,
  box_eco_2: 20,
  box_eco_3: 20,
  desayuno_berlioz: 10,
  carrito_snacks: 300,
};

// Products that have NO minimum
export const NO_MINIMUM_PRODUCTS = ['mini_box'];

export function meetsMinimum(productCode: string, quantity: number): boolean {
  if (NO_MINIMUM_PRODUCTS.includes(productCode)) return true;
  const min = PRODUCT_MINIMUMS[productCode];
  if (!min) return true;
  return quantity >= min;
}

export function getMinimumNote(productCode: string): string | null {
  if (NO_MINIMUM_PRODUCTS.includes(productCode)) return null;
  const min = PRODUCT_MINIMUMS[productCode];
  if (!min) return null;
  return `Mínimo ${min} piezas iguales`;
}

// ── Mexican holidays (floating holidays use approximate fixed dates) ──
export const MEXICAN_HOLIDAYS = [
  '01-01', // Año Nuevo
  '02-03', // Primer lunes febrero (aprox)
  '03-17', // Tercer lunes marzo (aprox)
  '05-01', // Día del Trabajo
  '09-16', // Independencia
  '11-17', // Tercer lunes noviembre (aprox)
  '12-25', // Navidad
];

export const DELIVERY_FEE_BASE = 360;
export const DOUBLE_DELIVERY_FEE = 720;
export const EARLY_DELIVERY_SURCHARGE = 290;
export const PROPOSAL_VALIDITY_DAYS = 20;
export const SNACK_CART_MIN_PIECES = 300;

export const WEEKEND_MINIMUMS = {
  saturday: 3000,
  sunday: 5000,
  holiday: 5000,
};

// ── CP coverage ──
export type CPCoverage = { type: 'cdmx' | 'outside'; message: string };

export function isCDMXZone(cp: string): boolean {
  if (!cp || cp.length < 5) return false;
  const prefix = parseInt(cp.slice(0, 2), 10);
  return (prefix >= 1 && prefix <= 16) || (prefix >= 52 && prefix <= 57);
}

export function getCPCoverage(cp: string): CPCoverage | null {
  if (!cp || cp.length < 5) return null;
  if (isCDMXZone(cp)) {
    return { type: 'cdmx', message: '✓ Entregamos en tu zona' };
  }
  return {
    type: 'outside',
    message: '📦 Tu pedido es fuera de CDMX — sí entregamos en muchas ciudades. Para confirmar cobertura y costo especial: hola@berlioz.mx',
  };
}

// ── Date helpers ──
function isHoliday(dateStr: string): boolean {
  const mmdd = dateStr.slice(5);
  return MEXICAN_HOLIDAYS.includes(mmdd);
}

export type DateWarning = {
  type: 'yellow' | 'orange' | 'red';
  message: string;
  blockSubmit: boolean;
  weekendMinimum?: number;
};

export function getDateDisclaimer(dateStr: string): DateWarning | null {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();

  if (day === 0 || isHoliday(dateStr)) {
    return {
      type: 'orange',
      message: '📅 Domingos y festivos: mínimo $5,000 + IVA.',
      blockSubmit: false,
      weekendMinimum: WEEKEND_MINIMUMS.holiday,
    };
  }
  if (day === 6) {
    return {
      type: 'yellow',
      message: '📅 Sábados: pedido mínimo $3,000 + IVA. Realiza tu pedido antes del viernes a las 3pm.',
      blockSubmit: false,
      weekendMinimum: WEEKEND_MINIMUMS.saturday,
    };
  }
  return null;
}

// ── Cutoff logic (stricter: block tomorrow after 3pm) ──
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
  const minuteMX = nowMX.getMinutes();
  const currentMinutes = hourMX * 60 + minuteMX;

  const today = new Date(nowMX.getFullYear(), nowMX.getMonth(), nowMX.getDate());
  const selected = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round(
    (selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Today: always block
  if (diffDays <= 0) {
    return {
      type: 'red',
      message: '⛔ Pedidos para hoy no disponibles en línea. Contáctanos: hola@berlioz.mx · 55 8237 5469',
      blockSubmit: true,
    };
  }

  // Tomorrow after 3pm: block
  if (diffDays === 1 && currentMinutes >= 15 * 60) {
    return {
      type: 'red',
      message: '⛔ Ya no es posible cotizar para mañana — límite 3:00pm. Elige otra fecha o escríbenos: hola@berlioz.mx · 55 8237 5469',
      blockSubmit: true,
    };
  }

  return null;
}

// ── Duration blocks ──
export type DurationBlock = 'beverages_only' | 'beverages_snacks' | 'full_food' | 'full_day';

export function getDurationBlock(hours: number): DurationBlock {
  if (hours < 2) return 'beverages_only';
  if (hours <= 3) return 'beverages_snacks';
  if (hours <= 5) return 'full_food';
  return 'full_day';
}

export function getDurationNote(hours: number): string | null {
  if (hours < 2) return 'Para juntas cortas, lo ideal es tener bebidas disponibles';
  if (hours <= 3) return '¿Quieres agregar un surtido dulce para el postre?';
  if (hours <= 5) return 'Tu junta es larga — ¿quieres agregar bebidas para antes o después de comer?';
  return 'Evento de día completo — incluimos desayuno, comida y coffee break';
}

export function getBudgetTiers(budgetPerPerson: number) {
  return {
    adjusted: budgetPerPerson,
    recommended: budgetPerPerson * 1.2,
    complete: budgetPerPerson * 1.5,
  };
}

export function isValidMexicanCP(cp: string): boolean {
  return /^\d{5}$/.test(cp.trim());
}

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
  let totalMin = h * 60 + m - 90;
  if (totalMin < 300) totalMin = 300;
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

  const cutoff = getCutoffWarning(fechaInicio);
  if (cutoff?.type === 'yellow') {
    warnings.push('Tu pedido quedará sujeto a confirmación');
  }

  return warnings;
}

// ── Traffic alert for CDMX ──
export function getTrafficAlert(deliveryTime: string, cp: string): string | null {
  if (!deliveryTime || !cp) return null;
  const [h] = deliveryTime.split(':').map(Number);
  if (h >= 7 && h < 9 && isCDMXZone(cp)) {
    return '🚗 CDMX puede ser un caos a esa hora — recomendamos programar tu entrega máximo a las 6:30-7:00am.';
  }
  return null;
}

export function needsDoubleDelivery(eventType: string, personas: number): boolean {
  return eventType === 'coffee_break' && personas >= 30;
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

// ── Nudge triggers ──
export type NudgeTrigger =
  | 'mini_box_50_plus'
  | 'outside_cdmx'
  | 'personas_200_plus'
  | 'cb_premium_custom'
  | 'cutoff_blocked';

export interface NudgeInfo {
  trigger: NudgeTrigger;
  reason: string;
}

export function getNudgeTriggers(form: {
  personas: number;
  codigoPostal: string;
  eventType: string;
  fechaInicio: string;
}): NudgeInfo[] {
  const nudges: NudgeInfo[] = [];

  if (form.personas >= 200) {
    nudges.push({ trigger: 'personas_200_plus', reason: 'Pedido de 200+ personas requiere coordinación especial' });
  }
  if (form.personas >= 50 && form.eventType === 'comida') {
    nudges.push({ trigger: 'mini_box_50_plus', reason: 'Pedido grande de 50+ personas — cotización personalizada disponible' });
  }
  if (form.codigoPostal && !isCDMXZone(form.codigoPostal) && isValidMexicanCP(form.codigoPostal)) {
    nudges.push({ trigger: 'outside_cdmx', reason: 'Entrega fuera de CDMX/ZMVM' });
  }

  const cutoff = getCutoffWarning(form.fechaInicio);
  if (cutoff?.blockSubmit) {
    nudges.push({ trigger: 'cutoff_blocked', reason: 'Pedido fuera de horario de corte' });
  }

  return nudges;
}

export function buildNudgeMailto(form: {
  nombre: string;
  empresa: string;
  celular: string;
  eventType: string;
  fechaInicio: string;
  personas: number;
  codigoPostal: string;
}, nudgeReason: string): string {
  const subject = encodeURIComponent(`Cotización especial — ${form.empresa} — ${form.eventType}`);
  const body = encodeURIComponent(
    `Hola, soy ${form.nombre} de ${form.empresa}.\n` +
    `Número de contacto: ${form.celular}.\n` +
    `Evento: ${form.eventType}, ${form.fechaInicio}, ${form.personas} personas, CP ${form.codigoPostal}.\n` +
    `${nudgeReason}\n\n` +
    `Generado desde el cotizador Berlioz.`
  );
  return `mailto:hola@berlioz.mx?subject=${subject}&body=${body}`;
}

// ── Proactive staff suggestion ──
export function shouldSuggestStaff(eventType: string, personas: number, duracion: number): boolean {
  if (personas >= 50) return true;
  if (eventType === 'coffee_break' && personas >= 20) return true;
  if (eventType === 'capacitacion' && duracion >= 4) return true;
  return false;
}
