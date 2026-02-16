import { GitBranch, AlertTriangle, Route } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const DELIVERABLES = [
  {
    icon: GitBranch,
    title: 'Root-Cause Map',
    subtitle: 'From Smoke to Source',
    body: 'Every symptom (late jobs, margin slippage, team burnout) traced back to the ONE constraint causing it all. No more guessing. No more Band-Aids.',
  },
  {
    icon: AlertTriangle,
    title: 'Workflow Breakdown',
    subtitle: 'Where Work Actually Breaks',
    body: "Handoffs that fail. Queues where work waits. Rework loops that eat profit. Mapped in detail. You'll see exactly where the bottleneck lives.",
  },
  {
    icon: Route,
    title: '90-Day Stabilization Plan',
    subtitle: 'Ready to Execute',
    body: 'Prioritized by ROI. Assigned owners. Measurable KPIs. Weekly milestones. Start fixing the constraint on Monday.',
  },
];

export function DeliverablesSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto space-y-12">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
          What You Walk Away With
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DELIVERABLES.map(d => (
            <Card key={d.title} className="border-border">
              <CardContent className="pt-8 pb-6 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                  <d.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-center">{d.title}</h3>
                <p className="text-xs text-primary font-medium text-center uppercase tracking-wide">{d.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed text-center">{d.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground">Typical ROI: 6–10x in Year 1</p>
          <p className="text-sm text-muted-foreground">
            For a $5M company, 1% margin improvement = $50K annually.
            Investment: $7,500 · Return: $50K+ · Payback: &lt;2 months
          </p>
        </div>
      </div>
    </section>
  );
}
