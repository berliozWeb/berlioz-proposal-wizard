import type { IntakeForm } from '@/domain/entities/IntakeForm';

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
      return form.horasEntrega.length > 0;
    default:
      return false;
  }
}

export const TOTAL_WIZARD_STEPS = 3;
