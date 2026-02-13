import { Progress } from "@/components/ui/progress";

interface IntakeProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function IntakeProgressBar({ currentStep, totalSteps }: IntakeProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
