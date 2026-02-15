import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight">
          Fix the work before it burns out the people
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Root-cause clarity. Systems that stick. Humane performance.
        </p>
        <Button
          size="lg"
          className="mt-4 text-base px-8 py-6"
          onClick={() => navigate('/get-started/configure')}
        >
          Start with a Diagnostic
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
