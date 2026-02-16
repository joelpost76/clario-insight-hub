import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function FinalCTASection() {
  const navigate = useNavigate();
  const { ref, className: revealClass } = useScrollReveal();

  return (
    <section className="py-24 px-4 text-center">
      <div ref={ref} className={`max-w-2xl mx-auto space-y-6 ${revealClass}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Ready to Find Your Constraint?
        </h2>
        <p className="text-muted-foreground">
          2-week diagnostic · $7,500 founding rate · First 3 clients only · Expires March 31, 2026
        </p>
        <Button
          size="lg"
          className="text-base px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
          onClick={() => navigate('/get-started/configure')}
        >
          Claim Your Spot — Limited to 3
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-xs text-muted-foreground/60">
          Or email hello@unburnt.co to schedule a 15-minute call
        </p>
      </div>
    </section>
  );
}
