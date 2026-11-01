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
}

export interface ProfessionalServiceItem {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  referencePriceAmount?: number;
  currency: CurrencyCode;
  priceUnitLabel: LocalizedText;
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

