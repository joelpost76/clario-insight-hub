import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useServiceSelection } from '@/contexts/ServiceSelectionContext';
import { painPointsSchema } from '@/schemas/salesLeadSchema';
import { PAIN_POINT_LABELS, type PainPoint } from '@/types/salesLead';

type PainPointsData = z.infer<typeof painPointsSchema>;

interface PainPointsStepProps {
  onNext: () => void;
}

const URGENCY_OPTIONS = [
  { value: 'immediate', label: 'Need to start immediately' },
  { value: '1-3_months', label: 'Within 1–3 months' },
  { value: '3-6_months', label: 'Within 3–6 months' },
  { value: 'exploring', label: 'Just exploring options' },
] as const;

export function PainPointsStep({ onNext }: PainPointsStepProps) {
  const { formData, updateFormData } = useServiceSelection();

  const { handleSubmit, control, formState: { errors } } = useForm<PainPointsData>({
    resolver: zodResolver(painPointsSchema),
    defaultValues: {
      painPoints: formData.painPoints as PainPoint[],
      urgency: formData.urgency as any || undefined,
    },
  });

  const onSubmit = (data: PainPointsData) => {
    updateFormData({
      painPoints: data.painPoints,
      urgency: data.urgency,
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" id="pain-points-form">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">What challenges are you facing? *</Label>
          <p className="text-sm text-muted-foreground mt-1">Select 1–5 that resonate most.</p>
        </div>

        {errors.painPoints && (
          <p className="text-sm text-destructive">{errors.painPoints.message}</p>
        )}

        <Controller
          control={control}
          name="painPoints"
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.entries(PAIN_POINT_LABELS) as [PainPoint, string][]).map(([key, label]) => {
                const isChecked = field.value?.includes(key);
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isChecked ? 'border-primary bg-accent' : 'border-border bg-card'
                    }`}
                    onClick={() => {
                      const current = field.value || [];
                      if (isChecked) {
                        field.onChange(current.filter(p => p !== key));
                      } else if (current.length < 5) {
                        field.onChange([...current, key]);
                      }
                    }}
                  >
                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Timeline *</Label>
        {errors.urgency && (
          <p className="text-sm text-destructive">{errors.urgency.message}</p>
        )}

        <Controller
          control={control}
          name="urgency"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-2">
              {URGENCY_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    field.value === opt.value ? 'border-primary bg-accent' : 'border-border bg-card'
                  }`}
                  onClick={() => field.onChange(opt.value)}
                >
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="cursor-pointer text-sm text-foreground">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      </div>
    </form>
  );
}
