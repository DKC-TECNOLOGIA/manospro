"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type {
  CountryCode,
  CurrencyCode,
  LocaleCode,
  LocalizedText,
} from "@/types/domain";
import { useAuth } from "@/features/auth/AuthProvider";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import { esARDictionary, type Dictionary } from "./dictionaries/es-AR";
import { ptBRDictionary } from "./dictionaries/pt-BR";
import {
  formatRegionalCurrency,
  formatRegionalDate,
  REGION_CONFIGS,
  type RegionConfig,
} from "./regions";

const COUNTRY_STORAGE_KEY = "manospro.country.v1";
const countrySubscribers = new Set<() => void>();
let fallbackCountry: CountryCode = "AR";

function getStoredCountry(): CountryCode {
  if (typeof window === "undefined") return "AR";
  try {
    const stored = window.localStorage.getItem(COUNTRY_STORAGE_KEY);
    if (stored === "AR" || stored === "BR") return stored;
  } catch {
    // A preferência continua funcionando nesta sessão mesmo se o storage estiver bloqueado.
  }
  return fallbackCountry;
}

function subscribeToCountry(callback: () => void) {
  countrySubscribers.add(callback);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === COUNTRY_STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    countrySubscribers.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerCountry(): CountryCode {
  return "AR";
}

function writeStoredCountry(country: CountryCode) {
  fallbackCountry = country;
  try {
    window.localStorage.setItem(COUNTRY_STORAGE_KEY, country);
  } catch {
    // Keep the in-memory selection if browser storage is unavailable.
  }
  countrySubscribers.forEach((notify) => notify());
}

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const country = useSyncExternalStore(
    subscribeToCountry,
    getStoredCountry,
    getServerCountry
  );
  const manualSelectionRef = useRef(false);
  const lastUserIdRef = useRef<string | null | undefined>(undefined);
  const userId = user?.id;

  const regionConfig = REGION_CONFIGS[country];
  const locale = regionConfig.locale;
  const currency = regionConfig.currency;
  const dictionary = DICTIONARIES[locale];

  const setCountry = useCallback((nextCountry: CountryCode) => {
    manualSelectionRef.current = true;
    writeStoredCountry(nextCountry);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      manualSelectionRef.current = false;
    }
    if (!userId) return;

    let isActive = true;
    const loadAccountCountry = async () => {
      const { data, error } = await createSupabaseBrowserClient()
        .from("profiles")
        .select("country")
        .eq("id", userId)
        .maybeSingle();
      if (!isActive || error || manualSelectionRef.current) return;
      if (data?.country === "AR" || data?.country === "BR") {
        writeStoredCountry(data.country);
      }
    };

    void loadAccountCountry().catch(() => undefined);
    return () => {
      isActive = false;
    };
  }, [isAuthLoading, userId]);

  const tText = useCallback(
    (localized: LocalizedText): string => localized[locale],
    [locale]
  );

  const formatMoney = useCallback(
    (amount: number, overrideCurrency?: CurrencyCode): string =>
      formatRegionalCurrency(amount, overrideCurrency ?? currency, locale),
    [currency, locale]
  );

  const formatDate = useCallback(
    (dateISO: string): string => formatRegionalDate(dateISO, locale),
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
    [country, locale, currency, regionConfig, dictionary, setCountry, tText, formatMoney, formatDate]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale debe utilizarse dentro de un LocaleProvider");
  }
  return ctx;
}
