import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BerliozHeader from "@/components/BerliozHeader";
import ProgressBar from "@/components/wizard/ProgressBar";
import StepEventType from "@/components/wizard/StepEventType";
import StepPeople from "@/components/wizard/StepPeople";
import StepSchedule from "@/components/wizard/StepSchedule";
import StepLevel from "@/components/wizard/StepLevel";
import { DEFAULT_INTAKE, type IntakeForm } from "@/types";

const TOTAL_STEPS = 4;

const Index = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IntakeForm>({ ...DEFAULT_INTAKE });
  const navigate = useNavigate();

  const canNext = (): boolean => {
    switch (step) {
      case 1: return form.nombre.trim() !== '' && form.empresa.trim() !== '' && form.celular.trim() !== '' && form.eventType !== '';
      case 2: return form.personas > 0 && form.fechaInicio !== '';
      case 3: return form.horasEntrega.length > 0;
      case 4: return form.nivelEsperado !== '';
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Save company to localStorage on completion
      const key = 'berlioz_companies';
      try {
        const raw = localStorage.getItem(key);
        const companies: string[] = raw ? JSON.parse(raw) : [];
        if (!companies.some((c) => c.toLowerCase() === form.empresa.trim().toLowerCase())) {
          companies.push(form.empresa.trim());
          localStorage.setItem(key, JSON.stringify(companies));
        }
      } catch { /* ignore */ }

      navigate('/propuesta', { state: { form } });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <StepEventType form={form} onChange={setForm} />;
      case 2: return <StepPeople form={form} onChange={setForm} />;
      case 3: return <StepSchedule form={form} onChange={setForm} />;
      case 4: return <StepLevel form={form} onChange={setForm} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BerliozHeader />
      <main className="container max-w-2xl mx-auto px-6 py-8">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
        <div className="mt-10">{renderStep()}</div>
        <div className="flex justify-between mt-10">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-3 rounded-lg border border-border text-foreground font-body font-medium transition-all hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext()}
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-body font-semibold transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === TOTAL_STEPS ? 'Generar propuesta →' : 'Siguiente'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Index;
