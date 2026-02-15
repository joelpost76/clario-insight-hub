import { useServiceSelection } from '@/contexts/ServiceSelectionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function PriceCalculator() {
  const { services, calculateTotal } = useServiceSelection();
  const total = calculateTotal();
  const selectedServices = services.filter(s => s.selected);
  const selectedAddons = services.flatMap(s => s.addons.filter(a => a.selected));

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Estimated Investment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedServices.map(service => (
          <div key={service.id} className="flex justify-between text-sm">
            <span className="text-foreground">{service.name}</span>
            <span className="text-muted-foreground">
              {formatPrice(service.priceMin)} – {formatPrice(service.priceMax)}
            </span>
          </div>
        ))}

        {selectedAddons.length > 0 && (
          <>
            <div className="border-t border-border pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Add-ons</p>
              {selectedAddons.map(addon => (
                <div key={addon.id} className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{addon.name}</span>
                  <span className="text-muted-foreground">
                    {formatPrice(addon.priceMin)} – {formatPrice(addon.priceMax)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="border-t border-border pt-3">
          <div className="flex justify-between font-semibold">
            <span className="text-foreground">Total Range</span>
            <span className="text-primary">
              {formatPrice(total.min)} – {formatPrice(total.max)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Final pricing based on scope and timeline</p>
        </div>
      </CardContent>
    </Card>
  );
}
