import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ServiceSelection, AddonSelection, PriceRange, ServiceId } from '@/types/service';
import type { PainPoint, Urgency, Industry, RevenueRange } from '@/types/salesLead';
import { SERVICES, ADDONS } from '@/data/services';

interface FormData {
  companyName: string;
  industry: Industry | '';
  revenueRange: RevenueRange | '';
  headcount: number | '';
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  painPoints: PainPoint[];
  urgency: Urgency | '';
  referralSource: string;
  notes: string;
  privacyAccepted: boolean;
}

interface ServiceSelectionContextValue {
  services: ServiceSelection[];
  formData: FormData;
  currentStep: number;
  addService: (serviceId: ServiceId) => void;
  removeService: (serviceId: ServiceId) => void;
  addAddon: (addonId: string) => void;
  removeAddon: (addonId: string) => void;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  calculateTotal: () => PriceRange;
  resetAll: () => void;
}

const STORAGE_KEY = 'clario-get-started';

function loadFromStorage(): { services?: ServiceSelection[]; formData?: FormData; step?: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveToStorage(services: ServiceSelection[], formData: FormData, step: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ services, formData, step }));
  } catch { /* ignore */ }
}

function initializeServices(stored?: ServiceSelection[]): ServiceSelection[] {
  return SERVICES.map((service) => {
    const storedService = stored?.find(s => s.id === service.id);
    const applicableAddons: AddonSelection[] = ADDONS
      .filter(a => a.applicableTo.includes(service.id))
      .map(addon => ({
        ...addon,
        selected: storedService?.addons?.find(a => a.id === addon.id)?.selected ?? false,
      }));
    return {
      ...service,
      selected: service.required ? true : (storedService?.selected ?? false),
      addons: applicableAddons,
    };
  });
}

const defaultFormData: FormData = {
  companyName: '',
  industry: '',
  revenueRange: '',
  headcount: '',
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  painPoints: [],
  urgency: '',
  referralSource: '',
  notes: '',
  privacyAccepted: false,
};

const ServiceSelectionContext = createContext<ServiceSelectionContextValue | null>(null);

export function ServiceSelectionProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();

  const [services, setServices] = useState<ServiceSelection[]>(() => initializeServices(stored.services));
  const [formData, setFormData] = useState<FormData>(() => ({ ...defaultFormData, ...stored.formData }));
  const [currentStep, setCurrentStep] = useState(() => stored.step ?? 0);

  const persist = useCallback((s: ServiceSelection[], f: FormData, step: number) => {
    saveToStorage(s, f, step);
  }, []);

  const addService = useCallback((serviceId: ServiceId) => {
    setServices(prev => {
      const updated = prev.map(s => s.id === serviceId ? { ...s, selected: true } : s);
      persist(updated, formData, currentStep);
      return updated;
    });
  }, [formData, currentStep, persist]);

  const removeService = useCallback((serviceId: ServiceId) => {
    setServices(prev => {
      const service = prev.find(s => s.id === serviceId);
      if (service?.required) return prev;
      const updated = prev.map(s =>
        s.id === serviceId
          ? { ...s, selected: false, addons: s.addons.map(a => ({ ...a, selected: false })) }
          : s
      );
      persist(updated, formData, currentStep);
      return updated;
    });
  }, [formData, currentStep, persist]);

  const addAddon = useCallback((addonId: string) => {
    setServices(prev => {
      const updated = prev.map(s => ({
        ...s,
        addons: s.addons.map(a => a.id === addonId ? { ...a, selected: true } : a),
      }));
      persist(updated, formData, currentStep);
      return updated;
    });
  }, [formData, currentStep, persist]);

  const removeAddon = useCallback((addonId: string) => {
    setServices(prev => {
      const updated = prev.map(s => ({
        ...s,
        addons: s.addons.map(a => a.id === addonId ? { ...a, selected: false } : a),
      }));
      persist(updated, formData, currentStep);
      return updated;
    });
  }, [formData, currentStep, persist]);

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...data };
      persist(services, updated, currentStep);
      return updated;
    });
  }, [services, currentStep, persist]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, 4);
      persist(services, formData, next);
      return next;
    });
  }, [services, formData, persist]);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.max(prev - 1, 0);
      persist(services, formData, next);
      return next;
    });
  }, [services, formData, persist]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    persist(services, formData, step);
  }, [services, formData, persist]);

  const calculateTotal = useCallback((): PriceRange => {
    return services.reduce(
      (total, service) => {
        if (!service.selected) return total;
        const addonsTotal = service.addons.reduce(
          (at, addon) => ({
            min: at.min + (addon.selected ? addon.priceMin : 0),
            max: at.max + (addon.selected ? addon.priceMax : 0),
          }),
          { min: 0, max: 0 }
        );
        return {
          min: total.min + service.priceMin + addonsTotal.min,
          max: total.max + service.priceMax + addonsTotal.max,
        };
      },
      { min: 0, max: 0 }
    );
  }, [services]);

  const resetAll = useCallback(() => {
    const freshServices = initializeServices();
    setServices(freshServices);
    setFormData(defaultFormData);
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ServiceSelectionContext.Provider
      value={{
        services, formData, currentStep,
        addService, removeService, addAddon, removeAddon,
        updateFormData, nextStep, previousStep, goToStep,
        calculateTotal, resetAll,
      }}
    >
      {children}
    </ServiceSelectionContext.Provider>
  );
}

export function useServiceSelection() {
  const ctx = useContext(ServiceSelectionContext);
  if (!ctx) throw new Error('useServiceSelection must be used within ServiceSelectionProvider');
  return ctx;
}
