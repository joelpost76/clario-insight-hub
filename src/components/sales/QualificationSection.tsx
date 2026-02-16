import { Check, X } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const IDEAL = [
  '$3M–$10M residential Design+Build companies',
  'Margin compression (losing 1–2 points year-over-year)',
  'Jobs running 2+ weeks late consistently',
  'Change orders not captured/billed (leakage)',
  'Team burnout, high turnover risk',
  'Open to outside perspective and data-driven diagnosis',
];

const NOT_IDEAL = [
  'Under $3M revenue (different constraints)',
  'Perfect operations (nothing broken)',
  'Looking for quick fix or magic bullet',
  'Not willing to share data or give team access',
  'Want broad advice, not specific constraint ID',
  'Prefer to "figure it out ourselves"',
];

export function QualificationSection() {
  const { ref, className: revealClass } = useScrollReveal();
  return (
    <section className="py-20 px-4 bg-accent">
      <div ref={ref} className={`max-w-4xl mx-auto space-y-10 ${revealClass}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
          Is This Right for You?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ideal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Ideal For</h3>
            <ul className="space-y-3">
              {IDEAL.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Not ideal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Not Ideal For</h3>
            <ul className="space-y-3">
              {NOT_IDEAL.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
