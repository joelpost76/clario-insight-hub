export type ServiceId = 'diagnostic' | 'operating_system' | 'onboarding_system' | 'fractional_ops';

export interface Service {
  id: ServiceId;
  name: string;
  duration: string;
  priceMin: number;
  priceMax: number;
  bestFor: string;
  deliverables: string[];
  outcome: string;
  badge: string | null;
  icon: string;
  required: boolean;
  requires: ServiceId[];
}

export interface ServiceSelection extends Service {
  selected: boolean;
  addons: AddonSelection[];
}

export interface Addon {
  id: string;
  category: 'margin_protection' | 'delivery_stability' | 'people_adoption';
  name: string;
  priceMin: number;
  priceMax: number;
  applicableTo: ServiceId[];
}

export interface AddonSelection extends Addon {
  selected: boolean;
}

export interface PriceRange {
  min: number;
  max: number;
}
