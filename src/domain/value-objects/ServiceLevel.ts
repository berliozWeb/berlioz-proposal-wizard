export const SERVICE_LEVELS = ['economico', 'balanceado', 'premium'] as const;

export type ServiceLevel = typeof SERVICE_LEVELS[number];

export const SERVICE_LEVEL_OPTIONS = [
  { value: 'economico' as const, icon: '💰', label: 'Económico', desc: 'Funcional, sin extras' },
  { value: 'balanceado' as const, icon: '⭐', label: 'Balanceado', desc: 'Buena relación costo/valor' },
  { value: 'premium' as const, icon: '👑', label: 'Premium', desc: 'Experiencia completa con extras' },
] as const;

export function isValidServiceLevel(value: string): value is ServiceLevel {
  return SERVICE_LEVELS.includes(value as ServiceLevel);
}
