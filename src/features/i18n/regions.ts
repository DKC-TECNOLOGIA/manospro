import type {
  CityZoneOption,
  CountryCode,
  CurrencyCode,
  LocaleCode,
} from "@/types/domain";

export interface RegionConfig {
  country: CountryCode;
  locale: LocaleCode;
  currency: CurrencyCode;
  countryName: {
    "es-AR": string;
    "pt-BR": string;
  };
  languageLabel: string;
  currencySymbol: string;
  phonePrefix: string;
  phonePlaceholder: string;
  taxIdLabel: string;
  defaultCity: string;
}

export const REGION_CONFIGS: Record<CountryCode, RegionConfig> = {
  AR: {
    country: "AR",
    locale: "es-AR",
    currency: "ARS",
    countryName: {
      "es-AR": "Argentina",
      "pt-BR": "Argentina",
    },
    languageLabel: "Español (AR)",
    currencySymbol: "$",
    phonePrefix: "+54 9",
    phonePlaceholder: "+54 9 11 4567-8901",
    taxIdLabel: "CUIT / CUIL",
    defaultCity: "Buenos Aires (CABA)",
  },
  BR: {
    country: "BR",
    locale: "pt-BR",
    currency: "BRL",
    countryName: {
      "es-AR": "Brasil",
      "pt-BR": "Brasil",
    },
    languageLabel: "Português (BR)",
    currencySymbol: "R$",
    phonePrefix: "+55",
    phonePlaceholder: "+55 (11) 98765-4321",
    taxIdLabel: "CPF / CNPJ",
    defaultCity: "São Paulo, SP",
  },
};

export const CITY_ZONES: CityZoneOption[] = [
  {
    id: "ar-caba",
    country: "AR",
    city: "Buenos Aires (CABA)",
    neighborhoods: ["Palermo", "Belgrano", "Caballito", "Recoleta", "Almagro", "Villa Urquiza"],
    label: "Buenos Aires (CABA) — Palermo, Belgrano, Caballito",
  },
  {
    id: "ar-gba-norte",
    country: "AR",
    city: "GBA Zona Norte",
    neighborhoods: ["Vicente López", "Olivos", "San Isidro", "Tigre"],
    label: "GBA Zona Norte — Vicente López, San Isidro, Tigre",
  },
  {
    id: "ar-cordoba",
    country: "AR",
    city: "Córdoba Capital",
    neighborhoods: ["Nueva Córdoba", "Cerro de las Rosas", "General Paz", "Alberdi"],
    label: "Córdoba Capital — Nueva Córdoba, Cerro de las Rosas",
  },
  {
    id: "ar-rosario",
    country: "AR",
    city: "Rosario, Santa Fe",
    neighborhoods: ["Centro", "Pichincha", "Fisherton", "Echesortu"],
    label: "Rosario — Centro, Pichincha, Fisherton",
  },
  {
    id: "br-sp",
    country: "BR",
    city: "São Paulo, SP",
    neighborhoods: ["Pinheiros", "Vila Mariana", "Moema", "Perdizes", "Tatuapé"],
    label: "São Paulo, SP — Pinheiros, Vila Mariana, Moema",
  },
  {
    id: "br-curitiba",
    country: "BR",
    city: "Curitiba, PR",
    neighborhoods: ["Batel", "Água Verde", "Centro Cívico", "Santa Felicidade"],
    label: "Curitiba, PR — Batel, Água Verde, Centro Cívico",
  },
  {
    id: "br-florianopolis",
    country: "BR",
    city: "Florianópolis, SC",
    neighborhoods: ["Centro", "Trindade", "Itacorubi", "Campeche"],
    label: "Florianópolis, SC — Centro, Trindade, Campeche",
  },
  {
    id: "br-poa",
    country: "BR",
    city: "Porto Alegre, RS",
    neighborhoods: ["Moinhos de Vento", "Bom Fim", "Cidade Baixa", "Petrópolis"],
    label: "Porto Alegre, RS — Moinhos de Vento, Bom Fim",
  },
];

/**
 * Formatea importes monetarios según las reglas regionales de Argentina (ARS) o Brasil (BRL).
 * Nota de seguridad: Este formateador es exclusivamente visual. Ningún cálculo de cobro
 * ni validación de moneda debe ejecutarse confiando en el estado del navegador.
 */
export function formatRegionalCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: LocaleCode
): string {
  const maximumFractionDigits = currency === "ARS" ? 0 : 2;
  const minimumFractionDigits = currency === "ARS" ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

export function formatRegionalDate(dateISO: string, locale: LocaleCode): string {
  const parsed = new Date(dateISO);
  if (Number.isNaN(parsed.getTime())) {
    return dateISO;
  }
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
