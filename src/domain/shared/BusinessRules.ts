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

export const MEXICAN_HOLIDAYS = [
  '01-01', '02-03', '03-17', '05-01', '09-16', '11-17', '12-25',
];

export const DELIVERY_FEE_PER_TRIP = 360;
export const PROPOSAL_VALIDITY_DAYS = 20;

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
