import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDependencies } from '@/presentation/providers/AppDependenciesProvider';
import { DEFAULT_INTAKE, type IntakeForm } from '@/domain/entities/IntakeForm';
import { canAdvanceStep, TOTAL_WIZARD_STEPS } from '@/domain/shared/WizardValidation';

export function useWizardPresenter() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IntakeForm>({ ...DEFAULT_INTAKE });
  const navigate = useNavigate();
  const { buscarEmpresas } = useDependencies();

  const canNext = canAdvanceStep(step, form);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const goNext = useCallback(() => {
    if (step < TOTAL_WIZARD_STEPS) {
      setStep((s) => s + 1);
    } else {
      buscarEmpresas.save(form.empresa.trim());
      navigate('/propuesta', { state: { form } });
    }
  }, [step, form, navigate, buscarEmpresas]);

  return {
    step,
    form,
    setForm,
    canNext,
    goBack,
    goNext,
    totalSteps: TOTAL_WIZARD_STEPS,
    isLastStep: step === TOTAL_WIZARD_STEPS,
  };
}
