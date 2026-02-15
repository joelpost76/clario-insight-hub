import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceSelectionProvider, useServiceSelection } from '@/contexts/ServiceSelectionContext';
import { StepIndicator } from '@/components/sales/StepIndicator';
import { PriceCalculator } from '@/components/sales/PriceCalculator';
import { CompanyInfoStep } from '@/components/sales/CompanyInfoStep';
import { PainPointsStep } from '@/components/sales/PainPointsStep';
import { ContactInfoStep } from '@/components/sales/ContactInfoStep';
import { ReviewStep } from '@/components/sales/ReviewStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Send, Check, Loader2 } from 'lucide-react';
import { useSalesLeadSubmission } from '@/hooks/useSalesLeadSubmission';
import type { Urgency } from '@/types/salesLead';

const STEPS = ['Services', 'Company', 'Pain Points', 'Contact', 'Review'];

function ConfigureContent() {
  const navigate = useNavigate();
  const { services, formData, calculateTotal, goToStep, resetAll } = useServiceSelection();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const submission = useSalesLeadSubmission();

  const markComplete = (step: number) => {
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
  };

  const goNext = () => {
    markComplete(currentStep);
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepClick = (step: number) => {
    if (step <= Math.max(...completedSteps, currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    if (!privacyAccepted) return;

    try {
      await submission.mutateAsync({
        companyName: formData.companyName,
        industry: formData.industry || undefined,
        revenueRange: formData.revenueRange || undefined,
        headcount: formData.headcount || undefined,
        contactName: formData.contactName,
        contactTitle: formData.contactTitle || undefined,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        servicesSelected: services,
        painPoints: formData.painPoints,
        urgency: formData.urgency as Urgency,
        referralSource: formData.referralSource || undefined,
        notes: formData.notes || undefined,
      });
      resetAll();
      navigate('/get-started/thank-you');
    } catch {
      // Error handled by mutation
    }
  };

  const submitForm = (formId: string) => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/get-started')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Services
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Configure Your Package</h1>
          <StepIndicator
            currentStep={currentStep}
            steps={STEPS}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Selected Services</h2>
                    <p className="text-sm text-muted-foreground">
                      Review your selected services below. Go back to the landing page to change your selection.
                    </p>
                    {services.filter(s => s.selected).map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                        <Check className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentStep === 1 && <CompanyInfoStep onNext={goNext} />}
                {currentStep === 2 && <PainPointsStep onNext={goNext} />}
                {currentStep === 3 && <ContactInfoStep onNext={goNext} />}
                {currentStep === 4 && (
                  <ReviewStep
                    onEdit={(step) => setCurrentStep(step)}
                    onPrivacyChange={setPrivacyAccepted}
                    privacyAccepted={privacyAccepted}
                  />
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => {
                    if (currentStep === 0) {
                      goNext();
                    } else if (currentStep === 1) {
                      submitForm('company-info-form');
                    } else if (currentStep === 2) {
                      submitForm('pain-points-form');
                    } else if (currentStep === 3) {
                      submitForm('contact-info-form');
                    }
                  }}
                >
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!privacyAccepted || submission.isPending}
                >
                  {submission.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit Request
                </Button>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-8 self-start">
            <PriceCalculator />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceConfiguration() {
  return (
    <ServiceSelectionProvider>
      <ConfigureContent />
    </ServiceSelectionProvider>
  );
}
