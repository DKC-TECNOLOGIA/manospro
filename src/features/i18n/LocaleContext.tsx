"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type {
  CountryCode,
  CurrencyCode,
  LocaleCode,
  LocalizedText,
} from "@/types/domain";
import { esARDictionary, type Dictionary } from "./dictionaries/es-AR";
import { ptBRDictionary } from "./dictionaries/pt-BR";
import {
  formatRegionalCurrency,
  formatRegionalDate,
  REGION_CONFIGS,
  type RegionConfig,
} from "./regions";

interface LocaleContextValue {
  country: CountryCode;
  locale: LocaleCode;
  currency: CurrencyCode;
  regionConfig: RegionConfig;
  dictionary: Dictionary;
  setCountry: (country: CountryCode) => void;
  tText: (localized: LocalizedText) => string;
  formatMoney: (amount: number, overrideCurrency?: CurrencyCode) => string;
  formatDate: (dateISO: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const DICTIONARIES: Record<LocaleCode, Dictionary> = {
  "es-AR": esARDictionary,
  "pt-BR": ptBRDictionary,
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Idioma y país inicial: Argentina (es-AR, ARS) según especificación funcional
  const [country, setCountryState] = useState<CountryCode>("AR");

  const regionConfig = REGION_CONFIGS[country];
  const locale = regionConfig.locale;
  const currency = regionConfig.currency;
  const dictionary = DICTIONARIES[locale];

  const setCountry = useCallback((nextCountry: CountryCode) => {
    setCountryState(nextCountry);
  }, []);

  const tText = useCallback(
    (localized: LocalizedText): string => {
      return localized[locale];
    },
    [locale]
  );

  const formatMoney = useCallback(
    (amount: number, overrideCurrency?: CurrencyCode): string => {
      return formatRegionalCurrency(amount, overrideCurrency ?? currency, locale);
    },
    [currency, locale]
  );

  const formatDate = useCallback(
    (dateISO: string): string => {
      return formatRegionalDate(dateISO, locale);
    },
    [locale]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      country,
      locale,
      currency,
      regionConfig,
      dictionary,
      setCountry,
      tText,
      formatMoney,
      formatDate,
    }),
    [
      country,
      locale,
      currency,
      regionConfig,
      dictionary,
      setCountry,
      tText,
      formatMoney,
      formatDate,
    ]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale debe utilizarse dentro de un LocaleProvider");
  }
  return ctx;
}
