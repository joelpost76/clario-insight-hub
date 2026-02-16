import { TrendingDown, CalendarX, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const PAINS = [
  {
    icon: TrendingDown,
    title: 'Margin Compression',
    body: "Jobs that should be profitable aren't. Change orders slip through. \"Small\" overruns add up. You're working harder but keeping less.",
    stat: '$75K lost on a $5M company',
  },
  {
    icon: CalendarX,
    title: 'Timeline Chaos',
    body: 'Schedule slippage, waiting on approvals, missing materials, rework loops. Clients are frustrated. You\'re firefighting daily.',
    stat: 'Jobs run 2–4 weeks late. Every time.',
  },
  {
    icon: UserX,
    title: 'Team Burnout',
    body: "PMs working nights and weekends. Field leads doing admin. You're making every decision. People talk about quitting.",
    stat: '30% turnover last year',
  },
];

export function ProblemAmplification() {
  const { ref, className: revealClass } = useScrollReveal();
  return (
    <section className="py-12 px-4 bg-accent">
      <div ref={ref} className={`max-w-5xl mx-auto space-y-12 ${revealClass}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
          Does This Sound Familiar?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAINS.map((p) => (
            <Card key={p.title} className="border-border">
              <CardContent className="pt-8 pb-6 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-background flex items-center justify-center">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-center">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-center">{p.body}</p>
                <p className="text-sm font-semibold text-primary text-center">{p.stat}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-base text-foreground font-medium">
            Here's the problem: These aren't separate issues.
          </p>
          <p className="text-base text-foreground">
            They're <span className="font-bold text-primary">SYMPTOMS</span> of one underlying constraint.
            Fix the constraint, and everything else gets easier.
          </p>
        </div>
      </div>
    </section>
  );
}
