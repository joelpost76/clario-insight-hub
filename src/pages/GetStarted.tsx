import { HeroSection } from '@/components/sales/HeroSection';
import { ProblemAmplification } from '@/components/sales/ProblemAmplification';
import { InsightSection } from '@/components/sales/InsightSection';
import { HowItWorks } from '@/components/sales/HowItWorks';
import { DeliverablesSection } from '@/components/sales/DeliverablesSection';
import { QualificationSection } from '@/components/sales/QualificationSection';
import { FoundingOfferSection } from '@/components/sales/FoundingOfferSection';
import { FAQSection } from '@/components/sales/FAQSection';
import { FinalCTASection } from '@/components/sales/FinalCTASection';

export default function GetStarted() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ProblemAmplification />
      <InsightSection />
      <HowItWorks />
      <DeliverablesSection />
      <QualificationSection />
      <FoundingOfferSection />
      <FAQSection />
      <FinalCTASection />

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>Clario™ by UNBURNT</span>
          <span>hello@unburnt.co</span>
        </div>
      </footer>
    </div>
  );
}
