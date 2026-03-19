export type DeliveryPeriod = 'manana' | 'mediodia' | 'noche';

export const DELIVERY_HOURS = ['7:00am', '9:00am', '1:00pm', '7:00pm'] as const;

export const DELIVERY_PERIOD_OPTIONS: { value: DeliveryPeriod; label: string }[] = [
  { value: 'manana', label: 'Mañana' },
  { value: 'mediodia', label: 'Mediodía' },
  { value: 'noche', label: 'Noche' },
];
