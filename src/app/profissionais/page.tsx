"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CITY_ZONES } from "@/features/i18n/regions";
import {
  fetchRealCategories,
  searchRealProfessionals,
  type PaginatedProfessionalsResult,
} from "@/services/supabase/professionals";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { Button } from "@/components/ui/Button";
import type { CategorySlug, CountryCode, ServiceCategory } from "@/types/domain";

const PAGE_SIZE = 6;

function DirectoryContent() {
  const searchParams = useSearchParams();
  const { dictionary, locale, tText } = useLocale();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCity = searchParams.get("city") ?? "all";
  const initialCategory =
    (searchParams.get("category") as CategorySlug | "all" | null) ?? "all";

  // Estado del texto escrito vs texto con debounce (350ms) para evitar consultas en cada tecla
  const [rawQuery, setRawQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | "all">(
    initialCategory
  );
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | "ALL">(
    "ALL"
  );
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [sortBy, setSortBy] = useState<"recent" | "experience" | "rating">(
    "recent"
  );
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [result, setResult] = useState<PaginatedProfessionalsResult>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
    hasAnyReviewsInResult: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounce de 350ms para la búsqueda por texto
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(rawQuery);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [rawQuery]);

  // Carga de categorías reales desde Supabase
  useEffect(() => {
    fetchRealCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {
        // Las categorías también se manejan en la consulta principal
      });
  }, []);

  const availableCities = useMemo(() => {
    if (selectedCountry === "ALL") return CITY_ZONES;
    return CITY_ZONES.filter((z) => z.country === selectedCountry);
  }, [selectedCountry]);

  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await searchRealProfessionals({
        query: debouncedQuery,
        categorySlug: selectedCategory,
        country: selectedCountry,
        city: selectedCity,
        sortBy,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(res);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : dictionary.directoryPage.errorDescription
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedQuery,
    selectedCategory,
    selectedCountry,
    selectedCity,
    sortBy,
    page,
    dictionary.directoryPage.errorDescription,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void executeSearch();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [executeSearch]);

  const handleResetFilters = () => {
    setRawQuery("");
    setDebouncedQuery("");
    setSelectedCategory("all");
    setSelectedCountry("ALL");
    setSelectedCity("all");
    setSortBy("recent");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[#DFD8CC] pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#24272B]">
            {dictionary.directoryPage.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#525860]">
            {locale === "es-AR"
              ? "Buscá profesionales por nombre, especialidad y zona para encontrar a la persona indicada para tu próximo trabajo."
              : "Busque profissionais por nome, especialidade e região para encontrar a pessoa certa para o seu próximo serviço."}
          </p>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="mt-6 rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-2xs">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Búsqueda con debounce */}
          <div className="md:col-span-4">
            <label
              htmlFor="dir-search"
              className="mb-1.5 block text-xs font-bold text-[#24272B]"
            >
              {dictionary.directoryPage.searchInputLabel}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#666C75]"
                aria-hidden="true"
              />
              <input
                id="dir-search"
                type="text"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder={dictionary.directoryPage.searchInputPlaceholder}
                className="h-10 w-full rounded-xl border border-[#D4CCC0] bg-[#F7F4EE]/50 pr-3 pl-9 text-sm text-[#24272B] focus:border-[#F28C28] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Categoría real */}
          <div className="md:col-span-3">
            <label
              htmlFor="dir-category"
              className="mb-1.5 block text-xs font-bold text-[#24272B]"
            >
              {dictionary.directoryPage.categoryFilterLabel}
            </label>
            <select
              id="dir-category"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as CategorySlug | "all");
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none"
            >
              <option value="all">{dictionary.hero.searchCategoryAll}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {tText(cat.name)}
                </option>
              ))}
            </select>
          </div>

          {/* País */}
          <div className="md:col-span-2">
            <label
              htmlFor="dir-country"
              className="mb-1.5 block text-xs font-bold text-[#24272B]"
            >
              {dictionary.directoryPage.countryFilterLabel}
            </label>
            <select
              id="dir-country"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value as CountryCode | "ALL");
                setSelectedCity("all");
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none"
            >
              <option value="ALL">Argentina + Brasil</option>
              <option value="AR">Argentina (ARS)</option>
              <option value="BR">Brasil (BRL)</option>
            </select>
          </div>

          {/* Ciudad / Zona */}
          <div className="md:col-span-3">
            <label
              htmlFor="dir-city"
              className="mb-1.5 block text-xs font-bold text-[#24272B]"
            >
              {dictionary.directoryPage.zoneFilterLabel}
            </label>
            <select
              id="dir-city"
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none"
            >
              <option value="all">{dictionary.hero.searchZoneAll}</option>
              {availableCities.map((zone) => (
                <option key={zone.id} value={zone.city}>
                  {zone.city} ({zone.country})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra inferior de ordenamiento y conteo */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE6DC] pt-3.5 text-xs">
          <p className="font-semibold text-[#3D4249]">
            <span className="font-mono font-bold text-[#24272B]">
              {result.totalCount}
            </span>{" "}
            {locale === "es-AR"
              ? "perfiles públicos encontrados"
              : "perfis públicos encontrados"}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="h-3.5 w-3.5 text-[#5A6068]"
                aria-hidden="true"
              />
              <label htmlFor="dir-sort" className="font-semibold text-[#5A6068]">
                {dictionary.directoryPage.sortByLabel}:
              </label>
              <select
                id="dir-sort"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(
                    e.target.value as "recent" | "experience" | "rating"
                  );
                  setPage(1);
                }}
                className="rounded-lg border border-[#D4CCC0] bg-[#F7F4EE] px-2.5 py-1 text-xs font-semibold text-[#24272B]"
              >
                <option value="recent">
                  {dictionary.directoryPage.sortRelevance}
                </option>
                <option value="experience">
                  {dictionary.directoryPage.sortExperience}
                </option>
                {/* Solo muestra ordenación por nota cuando existen reseñas reales */}
                {result.hasAnyReviewsInResult && (
                  <option value="rating">
                    {locale === "es-AR"
                      ? "Mayor calificación real"
                      : "Maior avaliação real"}
                  </option>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="cursor-pointer font-semibold text-[#C86D14] hover:underline"
            >
              {dictionary.directoryPage.clearFilters}
            </button>
          </div>
        </div>
      </div>

      {/* ESTADO 1: CARGANDO */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 rounded-2xl border border-[#DFD8CC] bg-white p-12 text-center"
        >
          <Loader2
            className="mx-auto h-8 w-8 animate-spin text-[#F28C28]"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold text-[#24272B]">
            {locale === "es-AR"
              ? "Buscando profesionales..."
              : "Buscando profissionais..."}
          </p>
        </div>
      )}

      {/* ESTADO 2: ERROR */}
      {!isLoading && errorMessage && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-10 text-center"
        >
          <AlertTriangle
            className="mx-auto h-9 w-9 text-[#B93829]"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-lg font-bold text-[#24272B]">
            {dictionary.directoryPage.errorTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[#525860]">
            {errorMessage}
          </p>
          <div className="mt-5">
            <Button
              variant="graphite"
              size="md"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void executeSearch()}
            >
              {dictionary.directoryPage.retryBtn}
            </Button>
          </div>
        </div>
      )}

      {/* ESTADO 3: VACÍO O RESULTADOS CON PAGINACIÓN */}
      {!isLoading &&
        !errorMessage &&
        (result.items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#DFD8CC] bg-white p-12 text-center">
            <FilterX
              className="mx-auto h-9 w-9 text-[#F28C28]"
              aria-hidden="true"
            />
            <h2 className="mt-3 text-lg font-bold text-[#24272B]">
              {dictionary.directoryPage.emptyTitle}
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-[#525860]">
              {dictionary.directoryPage.emptyDescription}
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="primary" onClick={handleResetFilters}>
                {dictionary.directoryPage.clearFilters}
              </Button>
              <Link
                href="/cadastro?role=professional"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D4CCC0] px-5 text-sm font-bold text-[#24272B] transition hover:border-[#F28C28] hover:text-[#C86D14]"
              >
                {dictionary.directoryPage.professionalCta}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {result.items.map((professional) => (
                <ProfessionalCard
                  key={professional.userId}
                  professional={professional}
                />
              ))}
            </div>

            {/* Controles de paginación */}
            {result.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-[#DFD8CC] bg-white px-5 py-3.5">
                <span className="text-xs font-semibold text-[#525860]">
                  {locale === "es-AR"
                    ? `Página ${result.page} de ${result.totalPages}`
                    : `Página ${result.page} de ${result.totalPages}`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.page <= 1}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {locale === "es-AR" ? "Anterior" : "Anterior"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.page >= result.totalPages}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={() =>
                      setPage((p) => Math.min(result.totalPages, p + 1))
                    }
                  >
                    {locale === "es-AR" ? "Siguiente" : "Próxima"}
                  </Button>
                </div>
              </div>
            )}
          </>
        ))}
    </div>
  );
}

export default function ProfessionalsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#525860]">
          Cargando directorio...
        </div>
      }
    >
      <DirectoryContent />
    </Suspense>
  );
}
