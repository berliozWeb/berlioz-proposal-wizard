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
  <div className="flex items-center justify-between gap-4">
    {steps.map((step, i) => {
      const done = i < currentStep;
      const active = i === currentStep;
      return (
        <div key={i} className="flex items-center gap-3 flex-1 last:flex-none">
          {/* Node */}
          <div className="relative group">
            <div
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-heading font-black shrink-0 transition-all duration-500",
                done && "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                active && "bg-primary text-primary-foreground ring-8 ring-primary/5 shadow-xl shadow-primary/10",
                !done && !active && "bg-muted/50 text-muted-foreground border border-border"
              )}
            >
              {done ? (
                <Check className="w-5 h-5 stroke-[3]" />
              ) : (
                <span className={cn(active ? "scale-110" : "scale-100", "transition-transform")}>{i + 1}</span>
              )}
            </div>
            {/* Pulsing effect for active */}
            {active && (
              <div className="absolute inset-0 rounded-2xl animate-ping bg-primary/20 -z-10" style={{ animationDuration: '3s' }} />
            )}
          </div>

          {/* Labels */}
          <div className="hidden md:block min-w-0 flex-1">
            <p className={cn(
              "font-heading text-[11px] font-bold uppercase tracking-[0.15em] truncate mb-0.5", 
              active ? "text-primary" : done ? "text-foreground/70" : "text-muted-foreground"
            )}>
              {step.label}
            </p>
            {step.sublabel && (
              <p className="font-body text-[10px] text-muted-foreground truncate">{step.sublabel}</p>
            )}
          </div>

          {/* Line */}
          {i < steps.length - 1 && (
            <div className="flex-1 px-2 hidden sm:block">
              <div className="relative h-[2px] w-full bg-border rounded-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-primary transition-all duration-700 ease-in-out" 
                  style={{ width: done ? '100%' : '0%' }}
                />
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export default StepperProgress;