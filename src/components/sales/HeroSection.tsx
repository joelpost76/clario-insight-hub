import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export function HeroSection() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative overflow-hidden py-28 md:py-36 px-4">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Accent glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative max-w-3xl mx-auto text-center space-y-8">
        {/* Eyebrow */}
        <span
          className={`inline-block text-xs font-semibold tracking-[0.25em] uppercase text-primary transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          Operations Consulting
        </span>

        {/* Headline */}
        <h1
          className={`text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight transition-all duration-700 delay-150 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Fix the work before it
          <br />
          <span className="text-primary">burns out</span> the people
        </h1>

        {/* Subheadline */}
        <p
          className={`text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto transition-all duration-700 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Root-cause clarity. Systems that stick. Humane performance.
        </p>

        {/* CTA */}
        <div
          className={`transition-all duration-700 delay-[450ms] ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Button
            size="lg"
            className="text-base px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
            onClick={() => navigate('/get-started/configure')}
          >
            Start with a Diagnostic
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Trust line */}
        <p
          className={`text-xs text-muted-foreground/60 tracking-wide uppercase transition-all duration-700 delay-[600ms] ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          2-week diagnostic · Starting at $7,500
        </p>
      </div>
    </section>
  );
}
