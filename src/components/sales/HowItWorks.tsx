import { Mic, Search, Map } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const STAGES = [
  {
    icon: Mic,
    label: 'Days 1–3',
    title: 'Capture the Signals',
    bullets: [
      'Interview your team (owners, PMs, field, subs)',
      'Observe workflows in action',
      'Review data (estimates, actuals, change orders)',
    ],
    note: 'Your time: 2 hours total',
  },
  {
    icon: Search,
    label: 'Days 4–7',
    title: 'Trace to the Source',
    bullets: [
      'Map workflow breakdowns',
      'Identify handoffs, queues, rework loops',
      'Isolate the ONE bottleneck causing cascade',
    ],
    note: 'Daily updates keep you in the loop',
  },
  {
    icon: Map,
    label: 'Days 8–10',
    title: '90-Day Fix Plan',
    bullets: [
      'Prioritized action plan (by ROI)',
      'Assigned owners, measurable KPIs',
      'Executive readout (1-hour presentation)',
    ],
    note: 'You walk away with a playbook, not a report',
  },
];

export function HowItWorks() {
  const { ref, className: revealClass } = useScrollReveal();
  return (
    <section className="py-12 px-4 bg-accent">
      <div ref={ref} className={`max-w-5xl mx-auto space-y-12 ${revealClass}`}>
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            How Clario™ Works: 2 Weeks to Clarity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STAGES.map((s, i) => (
            <Card key={s.title} className="border-border relative">
              {/* Step number */}
              <div className="absolute -top-3 left-4">
                <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {s.label}
                </span>
              </div>
              <CardContent className="pt-10 pb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                </div>
                <ul className="space-y-2">
                  {s.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-medium text-primary pt-2 border-t border-border">{s.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-foreground max-w-2xl mx-auto">
          At the end: You know <strong>exactly</strong> what's breaking your business and <strong>exactly</strong> how to fix it.
          No guesswork. No 100-page report. Just a clear path forward.
        </p>
      </div>
    </section>
  );
}
