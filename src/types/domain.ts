export type CountryCode = "AR" | "BR";
export type LocaleCode = "es-AR" | "pt-BR";
export type CurrencyCode = "ARS" | "BRL";

export type CategorySlug =
  | "construccion"
  | "hogar"
  | "electricidad-y-gas"
  | "belleza-y-bienestar"
  | "jardineria"
  | "transporte"
  | "salud"
  | "otros";

export type HiringModel = "direct_contact" | "quote_request";

export type AccountRole = "client" | "professional" | "admin";

export interface LocalizedText {
  "es-AR": string;
  "pt-BR": string;
}

export interface ServiceCategory {
  id: string;
  slug: CategorySlug;
  iconName:
    | "Hammer"
    | "Wrench"
    | "Zap"
    | "Sparkles"
    | "Trees"
    | "Truck"
    | "HeartPulse"
    | "Layers";
  name: LocalizedText;
  shortDescription: LocalizedText;
  examples: {
    "es-AR": string[];
    "pt-BR": string[];
  };
  subcategories: {
    id: string;
    name: LocalizedText;
  }[];
  demoProfessionalCount: Record<CountryCode, number>;
}

export interface ProfessionalServiceItem {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  referencePriceAmount?: number;
  currency: CurrencyCode;
  priceUnitLabel: LocalizedText;
}

export interface PortfolioWorkItem {
  id: string;
  title: LocalizedText;
  zoneLabel: string;
  year: number;
  imageUrl: string;
  categoryLabel: LocalizedText;
}

export interface DemoReviewItem {
  id: string;
  authorName: string;
  authorZone: string;
  dateISO: string;
  rating: 1 | 2 | 3 | 4 | 5;
  serviceProvided: LocalizedText;
  comment: LocalizedText;
  isDemoSample: true;
}

export interface ProfessionalProfile {
  id: string;
  slug: string;
  isDemoProfile: true;
  fullName: string;
  avatarUrl: string;
  coverUrl: string;
  country: CountryCode;
  city: string;
  neighborhood: string;
  coverageZones: string[];
  categorySlug: CategorySlug;
  primarySpecialty: LocalizedText;
  secondarySpecialties: {
    "es-AR": string[];
    "pt-BR": string[];
  };
  bio: LocalizedText;
  yearsOfExperience: number;
  languages: string[];
  matriculaInfo?: LocalizedText;
  hiringModels: HiringModel[];
  availabilitySummary: LocalizedText;
  scheduleDays: LocalizedText;
  referenceStartingPrice?: {
    amount: number;
    currency: CurrencyCode;
    unitLabel: LocalizedText;
  };
  demoMetrics: {
    sampleRating: number;
    sampleReviewCount: number;
    completedJobsNote: LocalizedText;
  };
  services: ProfessionalServiceItem[];
  portfolio: PortfolioWorkItem[];
  sampleReviews: DemoReviewItem[];
}

export interface CityZoneOption {
  id: string;
  country: CountryCode;
  city: string;
  neighborhoods: string[];
  label: string;
}

export interface ProfessionalFilterParams {
  query?: string;
  categorySlug?: CategorySlug | "all";
  country?: CountryCode | "ALL";
  city?: string;
  sortBy?: "relevance" | "rating" | "experience";
}

