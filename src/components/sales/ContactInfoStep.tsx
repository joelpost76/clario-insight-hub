import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceSelection } from '@/contexts/ServiceSelectionContext';
import { contactInfoSchema } from '@/schemas/salesLeadSchema';

type ContactInfo = z.infer<typeof contactInfoSchema>;

interface ContactInfoStepProps {
  onNext: () => void;
}

export function ContactInfoStep({ onNext }: ContactInfoStepProps) {
  const { formData, updateFormData } = useServiceSelection();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ContactInfo>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      contactName: formData.contactName,
      contactTitle: formData.contactTitle,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      referralSource: formData.referralSource,
      notes: formData.notes,
    },
  });

  const onSubmit = (data: ContactInfo) => {
    updateFormData({
      contactName: data.contactName,
      contactTitle: data.contactTitle || '',
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || '',
      referralSource: data.referralSource || '',
      notes: data.notes || '',
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="contact-info-form">
      <div className="space-y-2">
        <Label htmlFor="contactName">Your Name *</Label>
        <Input id="contactName" {...register('contactName')} placeholder="Full name" />
        {errors.contactName && <p className="text-sm text-destructive">{errors.contactName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactTitle">Your Role</Label>
        <Input id="contactTitle" {...register('contactTitle')} placeholder="e.g., Owner, COO, Operations Manager" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Email *</Label>
        <Input id="contactEmail" type="email" {...register('contactEmail')} placeholder="you@company.com" />
        {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone">Phone</Label>
        <Input id="contactPhone" type="tel" {...register('contactPhone')} placeholder="(555) 123-4567" />
        {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>How did you hear about us?</Label>
        <Select
          defaultValue={formData.referralSource || undefined}
          onValueChange={(val) => setValue('referralSource', val)}
        >
          <SelectTrigger><SelectValue placeholder="Select one" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="podcast">Podcast</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Information</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Anything else you'd like us to know? (max 1000 characters)"
          rows={4}
        />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
      </div>
    </form>
  );
}
