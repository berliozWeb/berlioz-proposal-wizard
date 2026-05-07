import type { EventType } from '@/domain/value-objects/EventType';
import type { ServiceLevel } from '@/domain/value-objects/ServiceLevel';
import type { DeliveryPeriod } from '@/domain/value-objects/DeliveryTime';

export type DietaryRestriction = 'vegetariano' | 'vegano' | 'sin_gluten' | 'sin_lactosa' | 'keto';

export const DIETARY_OPTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetariano', label: 'Vegetariano' },
  { value: 'vegano', label: 'Vegano' },
  { value: 'sin_gluten', label: 'Sin gluten' },
  { value: 'sin_lactosa', label: 'Sin lactosa' },
  { value: 'keto', label: 'Keto' },
];

export interface DietaryCount {
  tipo: DietaryRestriction;
  cantidad: number;
}

/** Read counts from form, with backwards-compat for legacy string[] form. */
export function getDietaryCounts(form: Pick<IntakeForm, 'restriccionesDieteticas' | 'dietaryCounts' | 'personas'>): DietaryCount[] {
  if (form.dietaryCounts && form.dietaryCounts.length > 0) return form.dietaryCounts;
  // legacy: assume the whole group has each restriction
  if (Array.isArray(form.restriccionesDieteticas) && form.restriccionesDieteticas.length > 0) {
    return form.restriccionesDieteticas.map(t => ({ tipo: t, cantidad: form.personas || 0 }));
  }
  return [];
}

export interface IntakeForm {
  nombre: string;
  empresa: string;
  celular: string;
  eventType: EventType | '';
  personas: number;
  codigoPostal: string;
  horarioEvento: string;       // e.g. "09:00"
  duracionEstimada: number;    // hours: 1,2,3,4,5,6
  tienePresupuesto: boolean;
  presupuestoPorPersona: number; // MXN per person (0 if no budget)
  fechaInicio: string;
  fechaFin?: string;
  esMultiDia: boolean;
  entregasPorDia: DeliveryPeriod[];
  horasEntrega: string[];
  horasEvento: number;
  nivelEsperado: ServiceLevel | '';
  tieneRestricciones: boolean;
  restriccionesDieteticas: DietaryRestriction[];
  /** Per-restriction count: e.g. [{ tipo:'vegano', cantidad:2 }, { tipo:'sin_gluten', cantidad:1 }] */
  dietaryCounts?: DietaryCount[];
  notasDieteticas?: string;
  confirmaRecepcion: boolean;
  contacto: {
    nombre: string;
    empresa: string;
    email: string;
    telefono?: string;
    atencion: string;
  };
}

export const DEFAULT_INTAKE: IntakeForm = {
  nombre: '',
  empresa: '',
  celular: '',
  eventType: '',
  personas: 0,
  codigoPostal: '',
  horarioEvento: '',
  duracionEstimada: 3,
  tienePresupuesto: false,
  presupuestoPorPersona: 0,
  fechaInicio: '',
  fechaFin: '',
  esMultiDia: false,
  entregasPorDia: [],
  horasEntrega: [],
  horasEvento: 4,
  nivelEsperado: '',
  tieneRestricciones: false,
  restriccionesDieteticas: [],
  dietaryCounts: [],
  notasDieteticas: '',
  confirmaRecepcion: false,
  contacto: {
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    atencion: '',
  },
};
