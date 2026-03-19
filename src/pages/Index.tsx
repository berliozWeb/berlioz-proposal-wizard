import BerliozHeader from "@/components/BerliozHeader";
import ProgressBar from "@/components/wizard/ProgressBar";
import StepEventType from "@/components/wizard/StepEventType";
import StepPeople from "@/components/wizard/StepPeople";
import StepSchedule from "@/components/wizard/StepSchedule";
import StepLevel from "@/components/wizard/StepLevel";
import { useWizardPresenter } from "@/presentation/hooks/useWizardPresenter";

const Index = () => {
  const { step, form, setForm, canNext, goBack, goNext, totalSteps, isLastStep } = useWizardPresenter();

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
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
        <div className="mt-10">{renderStep()}</div>
        <div className="flex justify-between mt-10">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="px-6 py-3 rounded-lg border border-border text-foreground font-body font-medium transition-all hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-body font-semibold transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLastStep ? 'Generar propuesta →' : 'Siguiente'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Index;
