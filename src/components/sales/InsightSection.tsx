import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const SYMPTOMS = [
  'Late jobs',
  'Change order leakage',
  'Team burnout',
  'Client complaints',
  'Rework loops',
  'Cash flow issues',
];

export function InsightSection() {
  const { ref, className: revealClass } = useScrollReveal();
  return (
    <section className="py-12 px-4">
      <div ref={ref} className={`max-w-5xl mx-auto space-y-12 ${revealClass}`}>
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            You're Fixing Symptoms, Not the Source
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Theory of Constraints (TOC): Every system has ONE constraint that limits throughput.
            Fix that, and everything downstream improves.
          </p>
        </div>

        {/* Constraint diagram */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {/* Symptoms cloud */}
          <div className="bg-accent rounded-xl p-6 space-y-2 w-full md:w-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Symptoms you see</p>
            {SYMPTOMS.map(s => (
              <div key={s} className="flex items-center gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {s}
              </div>
            ))}
          </div>

          <ArrowRight className="h-8 w-8 text-primary shrink-0 rotate-90 md:rotate-0" />

          {/* Root constraint */}
          <div className="border-2 border-primary rounded-xl p-6 w-full md:w-auto max-w-sm space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Root Constraint</p>
            <p className="text-sm text-foreground leading-relaxed">
              Change orders approved verbally on-site, but not captured in system until invoicing (45 days later).
            </p>
            <div className="border-t border-border pt-3 space-y-1">
              <p className="text-sm text-muted-foreground">Result: 30% of COs written off as "goodwill"</p>
              <p className="text-sm font-semibold text-primary">Value: $75K/year left on table</p>
            </div>
          </div>
        </div>

        <p className="text-center text-foreground font-medium">
          That's what Clario™ finds. In 2 weeks. With surgical precision.
        </p>
      </div>
    </section>
  );
}
