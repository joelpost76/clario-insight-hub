import { Target, Settings, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PROPS = [
  {
    icon: Target,
    title: 'Signal to Source',
    description: 'We isolate the constraints that create repeat problems.',
  },
  {
    icon: Settings,
    title: 'Systems that Stick',
    description: 'Workflows, roles, scorecards, and cadence your team can run.',
  },
  {
    icon: Heart,
    title: 'Humane Performance',
    description: 'Clarity and ownership without grinding people down.',
  },
];

export function ValuePropositions() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROPS.map((prop) => (
          <Card key={prop.title} className="text-center">
            <CardContent className="pt-8 pb-6 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <prop.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{prop.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{prop.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
