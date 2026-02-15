import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceSelection } from '@/contexts/ServiceSelectionContext';
import { companyInfoSchema } from '@/schemas/salesLeadSchema';

type CompanyInfo = z.infer<typeof companyInfoSchema>;

interface CompanyInfoStepProps {
  onNext: () => void;
}

export function CompanyInfoStep({ onNext }: CompanyInfoStepProps) {
  const { formData, updateFormData } = useServiceSelection();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CompanyInfo>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyName: formData.companyName,
      industry: formData.industry || undefined,
      revenueRange: formData.revenueRange || undefined,
      headcount: formData.headcount || undefined,
    },
  });

  const onSubmit = (data: CompanyInfo) => {
    updateFormData({
      companyName: data.companyName,
      industry: (data.industry as any) || '',
      revenueRange: (data.revenueRange as any) || '',
      headcount: typeof data.headcount === 'number' ? data.headcount : '',
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="company-info-form">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input id="companyName" {...register('companyName')} placeholder="Your company name" />
        {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Industry</Label>
        <Select
          defaultValue={formData.industry || undefined}
          onValueChange={(val) => setValue('industry', val as any)}
        >
          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="residential_design_build">Residential Design + Build</SelectItem>
            <SelectItem value="commercial_construction">Commercial Construction</SelectItem>
            <SelectItem value="remodeling">Remodeling</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Annual Revenue</Label>
        <Select
          defaultValue={formData.revenueRange || undefined}
          onValueChange={(val) => setValue('revenueRange', val as any)}
        >
          <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="under_1m">Under $1M</SelectItem>
            <SelectItem value="1m-5m">$1M – $5M</SelectItem>
            <SelectItem value="5m-10m">$5M – $10M</SelectItem>
            <SelectItem value="10m-25m">$10M – $25M</SelectItem>
            <SelectItem value="25m_plus">$25M+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headcount">Team Size</Label>
        <Input
          id="headcount"
          type="number"
          min={1}
          placeholder="Number of employees"
          {...register('headcount', { valueAsNumber: true })}
        />
      </div>
    </form>
  );
}
