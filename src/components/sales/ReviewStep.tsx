import { useServiceSelection } from '@/contexts/ServiceSelectionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, Edit2 } from 'lucide-react';
import { PAIN_POINT_LABELS, type PainPoint } from '@/types/salesLead';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const URGENCY_LABELS: Record<string, string> = {
  immediate: 'Need to start immediately',
  '1-3_months': 'Within 1–3 months',
  '3-6_months': 'Within 3–6 months',
  exploring: 'Just exploring options',
};

const INDUSTRY_LABELS: Record<string, string> = {
  residential_design_build: 'Residential Design + Build',
  commercial_construction: 'Commercial Construction',
  remodeling: 'Remodeling',
  mixed: 'Mixed',
  other: 'Other',
};

const REVENUE_LABELS: Record<string, string> = {
  under_1m: 'Under $1M',
  '1m-5m': '$1M – $5M',
  '5m-10m': '$5M – $10M',
  '10m-25m': '$10M – $25M',
  '25m_plus': '$25M+',
};

interface ReviewStepProps {
  onEdit: (step: number) => void;
  onPrivacyChange: (checked: boolean) => void;
  privacyAccepted: boolean;
}

export function ReviewStep({ onEdit, onPrivacyChange, privacyAccepted }: ReviewStepProps) {
  const { services, formData, calculateTotal } = useServiceSelection();
  const total = calculateTotal();
  const selectedServices = services.filter(s => s.selected);
  const selectedAddons = services.flatMap(s => s.addons.filter(a => a.selected));

  return (
    <div className="space-y-6">
      {/* Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Selected Services</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(0)}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedServices.map(s => (
            <div key={s.id} className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {s.name}
              </span>
              <span className="text-muted-foreground">
                {formatPrice(s.priceMin)} – {formatPrice(s.priceMax)}
              </span>
            </div>
          ))}
          {selectedAddons.map(a => (
            <div key={a.id} className="flex justify-between text-sm pl-6">
              <span className="text-muted-foreground">+ {a.name}</span>
              <span className="text-muted-foreground">
                {formatPrice(a.priceMin)} – {formatPrice(a.priceMax)}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-2 mt-3 flex justify-between font-semibold">
            <span>Total Estimated Investment</span>
            <span className="text-primary">{formatPrice(total.min)} – {formatPrice(total.max)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Company */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Company Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Company:</span> {formData.companyName}</p>
          {formData.industry && <p><span className="text-muted-foreground">Industry:</span> {INDUSTRY_LABELS[formData.industry] || formData.industry}</p>}
          {formData.revenueRange && <p><span className="text-muted-foreground">Revenue:</span> {REVENUE_LABELS[formData.revenueRange] || formData.revenueRange}</p>}
          {formData.headcount && <p><span className="text-muted-foreground">Team size:</span> {formData.headcount}</p>}
        </CardContent>
      </Card>

      {/* Pain Points */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Pain Points & Timeline</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="space-y-1">
            {formData.painPoints.map(p => (
              <li key={p} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" />
                {PAIN_POINT_LABELS[p as PainPoint] || p}
              </li>
            ))}
          </ul>
          {formData.urgency && (
            <p className="mt-2">
              <span className="text-muted-foreground">Timeline:</span> {URGENCY_LABELS[formData.urgency] || formData.urgency}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Contact Information</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {formData.contactName}</p>
          {formData.contactTitle && <p><span className="text-muted-foreground">Role:</span> {formData.contactTitle}</p>}
          <p><span className="text-muted-foreground">Email:</span> {formData.contactEmail}</p>
          {formData.contactPhone && <p><span className="text-muted-foreground">Phone:</span> {formData.contactPhone}</p>}
          {formData.referralSource && <p><span className="text-muted-foreground">Referral:</span> {formData.referralSource}</p>}
          {formData.notes && <p><span className="text-muted-foreground">Notes:</span> {formData.notes}</p>}
        </CardContent>
      </Card>

      {/* Privacy */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
        <Checkbox
          id="privacy"
          checked={privacyAccepted}
          onCheckedChange={(checked) => onPrivacyChange(!!checked)}
        />
        <Label htmlFor="privacy" className="text-sm text-foreground leading-relaxed cursor-pointer">
          I agree that Unburnt Consulting may use the information provided to contact me regarding their services. I understand my data will be handled in accordance with applicable privacy regulations.
        </Label>
      </div>
    </div>
  );
}
