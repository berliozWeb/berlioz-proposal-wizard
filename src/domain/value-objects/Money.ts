const MXN_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export function formatMXN(amount: number): string {
  return MXN_FORMATTER.format(amount);
}

export function calculateIVA(subtotal: number, rate = 0.16): number {
  return Math.round(subtotal * rate * 100) / 100;
}

export function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
