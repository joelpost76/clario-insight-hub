import { useServiceSelection } from '@/contexts/ServiceSelectionContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ADDONS } from '@/data/services';

const CATEGORY_LABELS: Record<string, string> = {
  margin_protection: 'Margin Protection',
  delivery_stability: 'Delivery Stability',
  people_adoption: 'People + Adoption',
};

export function AddOnModules() {
  const { services, addAddon, removeAddon } = useServiceSelection();
  const selectedServiceIds = services.filter(s => s.selected).map(s => s.id);

  const applicableAddons = ADDONS.filter(a =>
    a.applicableTo.some(sid => selectedServiceIds.includes(sid))
  );

  if (applicableAddons.length === 0) return null;

  const grouped = applicableAddons.reduce((acc, addon) => {
    if (!acc[addon.category]) acc[addon.category] = [];
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, typeof ADDONS>);

  const selectedAddonIds = new Set(
    services.flatMap(s => s.addons.filter(a => a.selected).map(a => a.id))
  );

  function formatPrice(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Add-On Modules</h2>
      <p className="text-sm text-muted-foreground">Enhance your selected services with targeted modules.</p>

      {Object.entries(grouped).map(([category, addons]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {CATEGORY_LABELS[category] || category}
          </h3>
          <div className="grid gap-3">
            {addons.map(addon => {
              const isSelected = selectedAddonIds.has(addon.id);
              return (
                <div
                  key={addon.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isSelected ? 'border-primary bg-accent' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={addon.id}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        checked ? addAddon(addon.id) : removeAddon(addon.id)
                      }
                    />
                    <Label htmlFor={addon.id} className="cursor-pointer">
                      <span className="text-sm font-medium text-foreground">{addon.name}</span>
                    </Label>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatPrice(addon.priceMin)} – {formatPrice(addon.priceMax)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
