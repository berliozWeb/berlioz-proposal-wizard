import type { IntakeForm } from '@/domain/entities/IntakeForm';
import { isValidMexicanCP, getCutoffWarning } from './BusinessRules';

export function canAdvanceStep(step: number, form: IntakeForm): boolean {
  switch (step) {
    case 1:
      return (
        form.nombre.trim() !== '' &&
        form.empresa.trim() !== '' &&
        form.celular.trim() !== '' &&
        form.eventType !== ''
      );
    case 2:
      return form.personas > 0 && form.fechaInicio !== '';
    case 3:
      return form.horasEntrega.length > 0 || form.horarioEvento !== '';
    default:
      return false;
  }
}

/** Validation for the cotiza inline flow (landing page) */
export function canSubmitCotizaForm(form: IntakeForm, eventType: string): boolean {
  const cutoff = getCutoffWarning(form.fechaInicio);
  if (cutoff?.blockSubmit) return false;

  return (
    form.personas > 0 &&
    form.fechaInicio !== '' &&
    isValidMexicanCP(form.codigoPostal) &&
    form.horarioEvento !== '' &&
    form.duracionEstimada > 0 &&
    eventType !== ''
  );
}

export const TOTAL_WIZARD_STEPS = 3;
