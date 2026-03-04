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

  const anim = (delay: string) =>
    `transition-all duration-700 ${delay} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <section className="relative overflow-hidden pt-16 pb-4 md:pt-24 md:pb-6 px-4">
      {/* Grid bg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        <span className={`inline-block text-xs font-semibold tracking-[0.25em] uppercase text-primary ${anim('delay-0')}`}>
          Operations Consulting for Design + Build
        </span>

        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight ${anim('delay-100')}`}>
          Your $5M Company Has 47 Problems.
          <br />
          But Only <span className="text-primary">ONE Constraint.</span>
        </h1>

        <p className={`text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto ${anim('delay-200')}`}>
          A 2-week diagnostic to find the ONE bottleneck costing you margin,
          timelines, and sanity—then a 90-day plan to fix it.
          <br />
          <span className="font-medium text-foreground">For residential Design+Build companies doing $3M–$10M.</span>
        </p>

        {/* Proof points */}
        <div className={`flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-foreground ${anim('delay-300')}`}>
          <span>+1–2% net margin</span>
          <span className="text-border">·</span>
          <span>−25% rework</span>
          <span className="text-border">·</span>
          <span>+30% change order capture</span>
        </div>

        {/* CTA */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${anim('delay-[400ms]')}`}>
          <Button
            size="lg"
            className="text-base px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
            onClick={() => navigate('/get-started/configure')}
          >
            Find Your Constraint
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-base px-8 py-6"
            onClick={() => navigate('/how-clario-works')}
          >
            See How It Works
          </Button>
        </div>

        <p className={`text-xs text-muted-foreground/70 tracking-wide ${anim('delay-[550ms]')}`}>
          Limited: First 3 founding clients only · Expires March 31, 2026
        </p>
      </div>
    </section>
  );
}
