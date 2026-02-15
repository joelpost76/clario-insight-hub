import { useServiceSelection } from '@/contexts/ServiceSelectionContext';
import { ServiceCard } from './ServiceCard';

export function ServiceSelectionGrid() {
  const { services, addService, removeService } = useServiceSelection();

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Choose Your Path</h2>
          <p className="text-muted-foreground">Every engagement starts with the Diagnostic. Add what you need.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {services.map((service) => {
            const depsSelected = service.requires.every(
              req => services.find(s => s.id === req)?.selected
            );
            return (
              <ServiceCard
                key={service.id}
                service={service}
                onSelect={() => addService(service.id)}
                onDeselect={() => removeService(service.id)}
                disabled={!depsSelected}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
