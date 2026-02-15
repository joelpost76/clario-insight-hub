import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ServiceSelection } from '@/types/service';
import type { PainPoint, Urgency } from '@/types/salesLead';

interface SubmitData {
  companyName: string;
  industry?: string;
  revenueRange?: string;
  headcount?: number | '';
  contactName: string;
  contactTitle?: string;
  contactEmail: string;
  contactPhone?: string;
  servicesSelected: ServiceSelection[];
  painPoints: PainPoint[];
  urgency: Urgency;
  referralSource?: string;
  notes?: string;
}

async function submitSalesLead(lead: SubmitData) {
  const selectedServices = lead.servicesSelected.filter(s => s.selected);
  const totalMin = selectedServices.reduce((sum, s) => {
    const addonMin = s.addons.filter(a => a.selected).reduce((a, addon) => a + addon.priceMin, 0);
    return sum + s.priceMin + addonMin;
  }, 0);
  const totalMax = selectedServices.reduce((sum, s) => {
    const addonMax = s.addons.filter(a => a.selected).reduce((a, addon) => a + addon.priceMax, 0);
    return sum + s.priceMax + addonMax;
  }, 0);

  const dbData = {
    company_name: lead.companyName,
    industry: lead.industry || null,
    revenue_range: lead.revenueRange || null,
    headcount: typeof lead.headcount === 'number' ? lead.headcount : null,
    contact_name: lead.contactName,
    contact_title: lead.contactTitle || null,
    contact_email: lead.contactEmail,
    contact_phone: lead.contactPhone || null,
    services_selected: lead.servicesSelected as any,
    total_estimated_investment: { min: totalMin, max: totalMax } as any,
    pain_points: lead.painPoints,
    urgency: lead.urgency,
    referral_source: lead.referralSource || null,
    notes: lead.notes || null,
  };

  const { data, error } = await supabase
    .from('sales_leads')
    .insert(dbData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function useSalesLeadSubmission() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: submitSalesLead,
    onSuccess: () => {
      toast({
        title: 'Request submitted!',
        description: "We'll be in touch within 24 hours.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
