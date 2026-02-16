import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

export function FoundingOfferSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Founding Client Program: First 3 Only
          </h2>
          <p className="text-muted-foreground">
            You get the full diagnostic at a founding rate. I get a case study to prove the methodology.
          </p>
        </div>

        <Card className="border-primary/40 shadow-lg shadow-primary/5">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-muted-foreground line-through">$10,000</span>
              <span className="text-3xl font-bold text-foreground">$7,500</span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">FOUNDING RATE</span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What You Get</p>
              {[
                'Full 2-week diagnostic',
                'Root-cause map, workflow breakdown, 90-day plan',
                'White-glove service (over-delivering on first 3)',
                'Direct access throughout process',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground border-t border-border pt-4">
              <p>Timeline: 2 weeks from kickoff</p>
              <p>Payment: 100% upfront at signing</p>
              <p className="font-medium text-foreground">Expires: March 31, 2026</p>
            </div>

            <Button
              size="lg"
              className="w-full text-base py-6 shadow-lg shadow-primary/20"
              onClick={() => navigate('/get-started/configure')}
            >
              Claim Your Founding Client Spot
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Guarantee */}
        <div className="flex items-start gap-4 bg-accent rounded-xl p-6">
          <ShieldCheck className="h-8 w-8 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm">100% Satisfaction Guarantee</p>
            <p className="text-sm text-muted-foreground mt-1">
              If you complete the diagnostic and don't see a clear path to 6x ROI, I'll refund 100% of your investment. No questions asked.
            </p>
          </div>
        </div>

        <p className="text-center text-sm font-medium text-primary">
          Only 3 spots available. 2 already claimed.
        </p>
      </div>
    </section>
  );
}
