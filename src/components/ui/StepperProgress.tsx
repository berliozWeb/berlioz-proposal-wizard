import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  sublabel?: string;
}

interface StepperProgressProps {
  steps: Step[];
  currentStep: number; // 0-indexed
}

const StepperProgress = ({ steps, currentStep }: StepperProgressProps) => (
  <div className="sticky top-0 z-50 bg-card border-b border-border py-4 px-6">
    <div className="max-w-3xl mx-auto flex items-center justify-between">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex items-center gap-3 flex-1 last:flex-none">
            {/* Circle */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-semibold shrink-0 transition-all",
                done && "bg-success text-success-foreground",
                active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                !done && !active && "bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {/* Labels */}
            <div className="hidden sm:block min-w-0">
              <p className={cn("font-body text-xs font-medium truncate", active ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </p>
              {step.sublabel && (
                <p className="font-body text-[10px] text-muted-foreground truncate">{step.sublabel}</p>
              )}
            </div>
            {/* Line */}
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-px mx-2", done ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default StepperProgress;