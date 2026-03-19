import type { EventType } from '@/domain/value-objects/EventType';
import type { ServiceLevel } from '@/domain/value-objects/ServiceLevel';
import type { DeliveryPeriod } from '@/domain/value-objects/DeliveryTime';

export interface IntakeForm {
  nombre: string;
  empresa: string;
  celular: string;
  eventType: EventType | '';
  personas: number;
  fechaInicio: string;
  fechaFin?: string;
  esMultiDia: boolean;
  entregasPorDia: DeliveryPeriod[];
  horasEntrega: string[];
  horasEvento: number;
  nivelEsperado: ServiceLevel | '';
  notasDieteticas?: string;
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
  personas: 30,
  fechaInicio: '',
  fechaFin: '',
  esMultiDia: false,
  entregasPorDia: [],
  horasEntrega: [],
  horasEvento: 4,
  nivelEsperado: '',
  notasDieteticas: '',
  contacto: {
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    atencion: '',
  },
};
