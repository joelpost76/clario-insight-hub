import { Target, Settings, Users, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Lock } from 'lucide-react';
import type { ServiceSelection } from '@/types/service';

const ICON_MAP: Record<string, React.ElementType> = {
  target: Target,
  settings: Settings,
  users: Users,
  compass: Compass,
};

interface ServiceCardProps {
  service: ServiceSelection;
  onSelect: () => void;
  onDeselect: () => void;
  disabled: boolean;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function ServiceCard({ service, onSelect, onDeselect, disabled }: ServiceCardProps) {
  const Icon = ICON_MAP[service.icon] || Target;
  const isLocked = service.required;

  return (
    <Card
      className={`relative transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
        service.selected
          ? 'border-primary ring-1 ring-primary/30'
          : disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={() => {
        if (isLocked || disabled) return;
        service.selected ? onDeselect() : onSelect();
      }}
    >
      {service.badge && (
        <div className="absolute -top-3 left-4">
          <Badge
            variant={service.badge.includes('REQUIRED') ? 'default' : 'secondary'}
            className="text-xs font-semibold"
          >
            {service.badge}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{service.name}</h3>
              <p className="text-sm text-muted-foreground">{service.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isLocked ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : service.selected ? (
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-lg font-semibold text-foreground">
          {formatPrice(service.priceMin)} – {formatPrice(service.priceMax)}
        </p>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Best for</p>
          <p className="text-sm text-foreground">{service.bestFor}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Deliverables</p>
          <ul className="space-y-1.5">
            {service.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium text-primary">{service.outcome}</p>
        </div>

        <Button
          variant={service.selected ? 'default' : 'outline'}
          className="w-full"
          disabled={isLocked || disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (isLocked || disabled) return;
            service.selected ? onDeselect() : onSelect();
          }}
        >
          {isLocked ? 'Included' : service.selected ? 'Selected ✓' : 'Add to Package'}
        </Button>
      </CardContent>
    </Card>
  );
}
