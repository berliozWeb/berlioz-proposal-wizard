// Franja de entrega prometida al cliente: hasta las 8:00 am es de 30 minutos
// (evento a las 8:00 → entrega entre 7:30 y 8:00); de 8:30 a 9:30 es de una
// hora; después de las 9:30, de 90 minutos.
export const SHORT_WINDOW_UNTIL = "08:00";
export const STANDARD_WINDOW_UNTIL = "09:30";

export function calcDeliveryWindow(eventTime: string): { from: string; to: string } {
  const [h, m] = eventTime.split(":").map(Number);
  const windowMinutes =
    eventTime <= SHORT_WINDOW_UNTIL ? 30 : eventTime <= STANDARD_WINDOW_UNTIL ? 60 : 90;
  let total = h * 60 + m - windowMinutes;
  if (total < 0) total = 0;
  const from = `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
  return { from, to: eventTime };
}
