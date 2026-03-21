export const EVENT_TYPES = [
  'desayuno',
  'coffee_break',
  'comida',
  'capacitacion',
  'evento_especial',
  'otro',
] as const;

export type EventType = typeof EVENT_TYPES[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  desayuno: 'Desayuno corporativo',
  coffee_break: 'Coffee break',
  comida: 'Working lunch',
  capacitacion: 'Capacitación (día completo)',
  evento_especial: 'Evento especial',
  otro: 'Otro',
};

export const EVENT_TYPE_OPTIONS = [
  { value: 'desayuno' as const, icon: '🍳', label: 'Desayuno corporativo' },
  { value: 'coffee_break' as const, icon: '☕', label: 'Coffee break' },
  { value: 'comida' as const, icon: '🍱', label: 'Working lunch' },
  { value: 'capacitacion' as const, icon: '🎓', label: 'Capacitación (día completo)' },
  { value: 'evento_especial' as const, icon: '🎉', label: 'Evento especial' },
  { value: 'otro' as const, icon: '📦', label: 'Otro' },
] as const;

export function isValidEventType(value: string): value is EventType {
  return EVENT_TYPES.includes(value as EventType);
}
