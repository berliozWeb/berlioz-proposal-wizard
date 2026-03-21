export const EVENT_TYPES = [
  'desayuno',
  'coffee_break',
  'comida',
  'capacitacion',
  'evento_especial',
  'filmacion',
  'otro',
] as const;

export type EventType = typeof EVENT_TYPES[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  desayuno: 'Desayuno',
  coffee_break: 'Coffee Break',
  comida: 'Working Lunch',
  capacitacion: 'Capacitación',
  evento_especial: 'Reunión ejecutiva',
  filmacion: 'Filmación / Scouting',
  otro: 'Otro',
};

export const EVENT_TYPE_DESCRIPTORS: Record<EventType, string> = {
  desayuno: 'Desde 4 personas · 7am en adelante',
  coffee_break: 'Desde 4 personas · mañana o tarde',
  comida: 'El producto estrella de Berlioz',
  capacitacion: 'Servicio completo de día',
  evento_especial: 'Para grupos pequeños y VIP',
  filmacion: 'Bags y opciones portables',
  otro: '',
};

export const EVENT_TYPE_OPTIONS = [
  { value: 'desayuno' as const, icon: '🍳', label: 'Desayuno' },
  { value: 'coffee_break' as const, icon: '☕', label: 'Coffee Break' },
  { value: 'comida' as const, icon: '🍱', label: 'Working Lunch' },
  { value: 'capacitacion' as const, icon: '🎓', label: 'Capacitación' },
  { value: 'evento_especial' as const, icon: '🎉', label: 'Reunión ejecutiva' },
  { value: 'filmacion' as const, icon: '🎬', label: 'Filmación / Scouting' },
] as const;

export function isValidEventType(value: string): value is EventType {
  return EVENT_TYPES.includes(value as EventType);
}
