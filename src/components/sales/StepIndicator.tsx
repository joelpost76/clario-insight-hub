import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  completedSteps: number[];
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ currentStep, steps, completedSteps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const isComplete = completedSteps.includes(i);
        const isCurrent = currentStep === i;

        return (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => onStepClick?.(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isCurrent
                  ? 'bg-primary text-primary-foreground font-medium'
                  : isComplete
                  ? 'bg-accent text-primary cursor-pointer hover:bg-accent/80'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isComplete && !isCurrent ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="text-xs font-medium">{i + 1}</span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`h-px w-6 ${isComplete ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
