import { useNavigate } from 'react-router-dom';
import { ServiceSelectionProvider } from '@/contexts/ServiceSelectionContext';
import { HeroSection } from '@/components/sales/HeroSection';
import { ValuePropositions } from '@/components/sales/ValuePropositions';
import { ServiceSelectionGrid } from '@/components/sales/ServiceSelectionGrid';
import { AddOnModules } from '@/components/sales/AddOnModules';
import { PriceCalculator } from '@/components/sales/PriceCalculator';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

function GetStartedContent() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ValuePropositions />
      <ServiceSelectionGrid />

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AddOnModules />
          </div>
          <div className="lg:sticky lg:top-8 self-start">
            <PriceCalculator />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center bg-accent">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground">2-week diagnostic starting at $7,500</p>
          <Button
            size="lg"
            className="text-base px-8 py-6"
            onClick={() => navigate('/get-started/configure')}
          >
            Configure Your Package
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default function GetStarted() {
  return (
    <ServiceSelectionProvider>
      <GetStartedContent />
    </ServiceSelectionProvider>
  );
}
