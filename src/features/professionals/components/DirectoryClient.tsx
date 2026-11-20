"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  FilterX,
  MessageSquare,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CITY_ZONES } from "@/features/i18n/regions";
import { SERVICE_CATEGORIES } from "@/features/categories/data";
import {
  searchRealProfessionals,
  type PaginatedProfessionalsResult,
} from "@/services/supabase/professionals";
import type { PublicFetchStatus } from "@/services/supabase/publicServer";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button } from "@/components/ui/Button";
import type { CategorySlug, CountryCode, ServiceCategory } from "@/types/domain";

const PAGE_SIZE = 6;
const VALID_CATEGORIES = new Set<string>(SERVICE_CATEGORIES.map((c) => c.slug));

export interface NormalizedDirectoryFilters {
  query: string;
  category: CategorySlug | "all";
  country: CountryCode | "ALL";
  city: string;
  contactMode: "all" | "direct" | "quote";
  sortBy: "recent" | "experience" | "rating";
  page: number;
}

interface DirectoryClientProps {
  initialCategories: ServiceCategory[];
  initialCategoriesStatus: PublicFetchStatus;
  initialResult: PaginatedProfessionalsResult;
  initialResultStatus: PublicFetchStatus;
  initialFilters: NormalizedDirectoryFilters;
}

function parseFiltersFromSearchParams(
  params: URLSearchParams
): NormalizedDirectoryFilters {
  const query = (params.get("q") ?? "").trim();
  const rawCategory = (params.get("category") ?? "").trim();
  const category: CategorySlug | "all" = VALID_CATEGORIES.has(rawCategory)
    ? (rawCategory as CategorySlug)
    : "all";

  const rawCountry = (params.get("country") ?? "").toUpperCase();
  const country: CountryCode | "ALL" =
    rawCountry === "AR" || rawCountry === "BR" ? rawCountry : "ALL";

  const city = (params.get("city") ?? "").trim() || "all";

  const rawContact = (params.get("contact") ?? "").toLowerCase();
  const contactMode: "all" | "direct" | "quote" =
    rawContact === "direct" || rawContact === "quote" ? rawContact : "all";

  const rawSort = (params.get("sort") ?? "").toLowerCase();
  const sortBy: "recent" | "experience" | "rating" =
    rawSort === "experience" || rawSort === "rating" ? rawSort : "recent";

  const parsedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return { query, category, country, city, contactMode, sortBy, page };
}

function buildDirectoryUrl(filters: NormalizedDirectoryFilters): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.country !== "ALL") params.set("country", filters.country);
  if (filters.city !== "all") params.set("city", filters.city);
  if (filters.contactMode !== "all") params.set("contact", filters.contactMode);
  if (filters.sortBy !== "recent") params.set("sort", filters.sortBy);
  if (filters.page > 1) params.set("page", String(filters.page));
  const qs = params.toString();
  return qs ? `/profissionais?${qs}` : "/profissionais";
}

function filtersSignature(f: NormalizedDirectoryFilters): string {
  return `${f.query}|${f.category}|${f.country}|${f.city}|${f.contactMode}|${f.sortBy}|${f.page}`;
}

export function DirectoryClient({
  initialCategories,
  initialCategoriesStatus,
  initialResult,
  initialResultStatus,
  initialFilters,
}: DirectoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dictionary, locale, tText } = useLocale();
  const isPortuguese = locale === "pt-BR";

  const urlFilters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  const initialSig = filtersSignature(initialFilters);
  const [prevInitialSig, setPrevInitialSig] = useState(initialSig);
  const [rawQuery, setRawQuery] = useState(urlFilters.query);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlFilters.query);
  const [result, setResult] =
    useState<PaginatedProfessionalsResult>(initialResult);
  const [status, setStatus] = useState<PublicFetchStatus>(initialResultStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  if (prevUrlQuery !== urlFilters.query) {
    setPrevUrlQuery(urlFilters.query);
    setRawQuery(urlFilters.query);
  }

  if (prevInitialSig !== initialSig) {
    setPrevInitialSig(initialSig);
    setResult(initialResult);
    setStatus(initialResultStatus);
    setIsLoading(false);
  }

  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const wasDrawerOpenRef = useRef(false);
  const drawerId = useId();

  const lastFetchedSignatureRef = useRef<string>(initialSig);
  const searchRequestIdRef = useRef(0);

  const categories =
    initialCategories.length > 0 ? initialCategories : SERVICE_CATEGORIES;

  // Debounce apenas na digitação -> router.replace para não poluir histórico
  useEffect(() => {
    const trimmed = rawQuery.trim();
    if (trimmed === urlFilters.query) return;

    const timer = window.setTimeout(() => {
      const next: NormalizedDirectoryFilters = {
        ...urlFilters,
        query: trimmed,
        page: 1,
      };
      router.replace(buildDirectoryUrl(next), { scroll: false });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [rawQuery, urlFilters, router]);

  const executeSearch = useCallback(
    async (filtersToRun: NormalizedDirectoryFilters) => {
      const requestId = ++searchRequestIdRef.current;
      setIsLoading(true);
      try {
        const res = await searchRealProfessionals({
          query: filtersToRun.query,
          categorySlug: filtersToRun.category,
          country: filtersToRun.country,
          city: filtersToRun.city,
          contactMode: filtersToRun.contactMode,
          sortBy: filtersToRun.sortBy,
          page: filtersToRun.page,
          pageSize: PAGE_SIZE,
        });
        if (requestId !== searchRequestIdRef.current) return;
        setResult(res);
        setStatus("ok");
      } catch {
        if (requestId !== searchRequestIdRef.current) return;
        setStatus("error");
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // Busca somente quando a assinatura da URL diverge do resultado mais recente (servidor ou cliente)
  useEffect(() => {
    const sig = filtersSignature(urlFilters);
    if (sig === initialSig) {
      lastFetchedSignatureRef.current = sig;
      searchRequestIdRef.current += 1;
      return;
    }
    if (sig === lastFetchedSignatureRef.current) return;
    lastFetchedSignatureRef.current = sig;
    void executeSearch(urlFilters);
  }, [urlFilters, initialSig, executeSearch]);

  // Gerenciamento de foco e Esc no drawer mobile de filtros
  useEffect(() => {
    if (mobileFiltersOpen) {
      wasDrawerOpenRef.current = true;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      drawerCloseRef.current?.focus();

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setMobileFiltersOpen(false);
          return;
        }
        if (event.key === "Tab" && drawerRef.current) {
          const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = previousOverflow;
        document.removeEventListener("keydown", handleKeyDown);
      };
    }

    if (wasDrawerOpenRef.current) {
      wasDrawerOpenRef.current = false;
      mobileFilterTriggerRef.current?.focus();
    }
  }, [mobileFiltersOpen]);

  const updateFilters = useCallback(
    (patch: Partial<NormalizedDirectoryFilters>, resetPage = true) => {
      const next: NormalizedDirectoryFilters = {
        ...urlFilters,
        ...patch,
        page: resetPage ? 1 : (patch.page ?? urlFilters.page),
      };
      router.push(buildDirectoryUrl(next), { scroll: false });
    },
    [urlFilters, router]
  );

  const handleResetFilters = () => {
    setRawQuery("");
    router.push("/profissionais", { scroll: false });
    setMobileFiltersOpen(false);
  };

  const availableCities = useMemo(() => {
    if (urlFilters.country === "ALL") return CITY_ZONES;
    return CITY_ZONES.filter((z) => z.country === urlFilters.country);
  }, [urlFilters.country]);

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.slug === urlFilters.category) ?? null,
    [categories, urlFilters.category]
  );

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (urlFilters.query) {
      chips.push({
        key: "q",
        label: `${isPortuguese ? "Busca" : "Búsqueda"}: "${urlFilters.query}"`,
        onRemove: () => {
          setRawQuery("");
          updateFilters({ query: "" });
        },
      });
    }
    if (urlFilters.category !== "all" && activeCategoryObj) {
      chips.push({
        key: "category",
        label: tText(activeCategoryObj.name),
        onRemove: () => updateFilters({ category: "all" }),
      });
    }
    if (urlFilters.country !== "ALL") {
      chips.push({
        key: "country",
        label:
          urlFilters.country === "BR" ? "Brasil (BRL)" : "Argentina (ARS)",
        onRemove: () => updateFilters({ country: "ALL", city: "all" }),
      });
    }
    if (urlFilters.city !== "all") {
      chips.push({
        key: "city",
        label: urlFilters.city,
        onRemove: () => updateFilters({ city: "all" }),
      });
    }
    if (urlFilters.contactMode !== "all") {
      chips.push({
        key: "contact",
        label:
          urlFilters.contactMode === "quote"
            ? dictionary.profileCard.quoteRequestBadge
            : dictionary.profileCard.directContactBadge,
        onRemove: () => updateFilters({ contactMode: "all" }),
      });
    }
    return chips;
  }, [
    urlFilters,
    activeCategoryObj,
    isPortuguese,
    tText,
    dictionary.profileCard.directContactBadge,
    dictionary.profileCard.quoteRequestBadge,
    updateFilters,
  ]);

  const renderFacetPanel = (idPrefix: string) => (
    <div className="space-y-6">
      {/* Busca por palavra-chave */}
      <div>
        <label
          htmlFor={`${idPrefix}-search`}
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
            id={`${idPrefix}-search`}
            type="search"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder={dictionary.directoryPage.searchInputPlaceholder}
            className="h-10 w-full rounded-xl border border-[#CFC6B8] bg-[#F7F4EE]/60 pr-3 pl-9 text-sm text-[#24272B] placeholder:text-[#6E747D] focus:border-[#F28C28] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C28]/25"
          />
        </div>
      </div>

      {/* Categorias (lista interativa estilo marketplace) */}
      <div>
        <p className="mb-2 text-xs font-bold text-[#24272B]">
          {dictionary.directoryPage.categoryFilterLabel}
        </p>
        <div className="space-y-1">
          <button
            type="button"
            aria-pressed={urlFilters.category === "all"}
            onClick={() => updateFilters({ category: "all" })}
            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${
              urlFilters.category === "all"
                ? "bg-[#24272B] text-[#F7F4EE]"
                : "text-[#3D4249] hover:bg-[#F7F4EE]"
            }`}
          >
            <span>{dictionary.hero.searchCategoryAll}</span>
          </button>
          {categories.map((cat) => {
            const selected = urlFilters.category === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={selected}
                onClick={() => updateFilters({ category: cat.slug })}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  selected
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "text-[#3D4249] hover:bg-[#F7F4EE]"
                }`}
              >
                <CategoryIcon
                  name={cat.iconName}
                  className={`h-3.5 w-3.5 shrink-0 ${
                    selected ? "text-[#F28C28]" : "text-[#6B717A]"
                  }`}
                />
                <span className="truncate">{tText(cat.name)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* País */}
      <div>
        <label
          htmlFor={`${idPrefix}-country`}
          className="mb-1.5 block text-xs font-bold text-[#24272B]"
        >
          {dictionary.directoryPage.countryFilterLabel}
        </label>
        <select
          id={`${idPrefix}-country`}
          value={urlFilters.country}
          onChange={(e) =>
            updateFilters({
              country: e.target.value as CountryCode | "ALL",
              city: "all",
            })
          }
          className="h-10 w-full rounded-xl border border-[#CFC6B8] bg-white px-3 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/25"
        >
          <option value="ALL">Argentina + Brasil</option>
          <option value="AR">Argentina (ARS)</option>
          <option value="BR">Brasil (BRL)</option>
        </select>
      </div>

      {/* Cidade / Região */}
      <div>
        <label
          htmlFor={`${idPrefix}-city`}
          className="mb-1.5 block text-xs font-bold text-[#24272B]"
        >
          {dictionary.directoryPage.zoneFilterLabel}
        </label>
        <select
          id={`${idPrefix}-city`}
          value={urlFilters.city}
          onChange={(e) => updateFilters({ city: e.target.value })}
          className="h-10 w-full rounded-xl border border-[#CFC6B8] bg-white px-3 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/25"
        >
          <option value="all">{dictionary.hero.searchZoneAll}</option>
          {availableCities.map((zone) => (
            <option key={zone.id} value={zone.city}>
              {zone.city} ({zone.country})
            </option>
          ))}
        </select>
      </div>

      {/* Modalidade de atendimento */}
      <div>
        <p className="mb-2 text-xs font-bold text-[#24272B]">
          {dictionary.profileDetail.sidebarHiringModelsLabel}
        </p>
        <div className="space-y-1.5">
          {(
            [
              {
                value: "all",
                label: isPortuguese ? "Todas as modalidades" : "Todas las modalidades",
                icon: null,
              },
              {
                value: "quote",
                label: dictionary.profileCard.quoteRequestBadge,
                icon: FileText,
              },
              {
                value: "direct",
                label: dictionary.profileCard.directContactBadge,
                icon: MessageSquare,
              },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = urlFilters.contactMode === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => updateFilters({ contactMode: item.value })}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  active
                    ? "border-[#24272B] bg-[#24272B] text-[#F7F4EE]"
                    : "border-[#E4DDD2] bg-[#FAF8F4] text-[#3D4249] hover:border-[#24272B]"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      active ? "text-[#F28C28]" : "text-[#6B717A]"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeFilterChips.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleResetFilters}
        >
          {dictionary.directoryPage.clearFilters}
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Breadcrumb
        items={[
          { label: dictionary.nav.home, href: "/" },
          { label: dictionary.directoryPage.title },
        ]}
        className="mb-4"
      />

      {/* Cabeçalho do Diretório */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[#DFD8CC] pb-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
            {activeCategoryObj
              ? tText(activeCategoryObj.name)
              : dictionary.directoryPage.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#565C64]">
            {dictionary.directoryPage.subtitle}
          </p>
        </div>

        {/* Barra de ordenação e botão de filtros no mobile */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-end">
          <button
            ref={mobileFilterTriggerRef}
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            aria-expanded={mobileFiltersOpen}
            aria-controls={drawerId}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#CFC6B8] bg-white px-3.5 text-xs font-bold text-[#24272B] shadow-2xs hover:border-[#24272B] lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#A65206]" aria-hidden="true" />
            <span>{isPortuguese ? "Filtros" : "Filtros"}</span>
            {activeFilterChips.length > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F28C28] px-1.5 font-mono text-[11px] font-bold text-[#1B1E22] tabular-nums">
                {activeFilterChips.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <label
              htmlFor="dir-sort"
              className="text-xs font-semibold text-[#565C64]"
            >
              {dictionary.directoryPage.sortByLabel}:
            </label>
            <select
              id="dir-sort"
              value={urlFilters.sortBy}
              onChange={(e) =>
                updateFilters({
                  sortBy: e.target.value as "recent" | "experience" | "rating",
                })
              }
              className="h-10 rounded-xl border border-[#CFC6B8] bg-white px-3 text-xs font-bold text-[#24272B] focus:border-[#F28C28] focus:outline-none"
            >
              <option value="recent">
                {dictionary.directoryPage.sortRelevance}
              </option>
              <option value="experience">
                {dictionary.directoryPage.sortExperience}
              </option>
              {result.hasAnyReviewsInResult && (
                <option value="rating">
                  {isPortuguese
                    ? "Melhor avaliados"
                    : "Mejor calificados"}
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Contagem + Chips de filtros ativos */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[#565C64]">
          <span className="font-mono text-sm font-bold text-[#24272B] tabular-nums">
            {result.totalCount}
          </span>{" "}
          {isPortuguese
            ? result.totalCount === 1
              ? "perfil verificado encontrado"
              : "perfis verificados encontrados"
            : result.totalCount === 1
              ? "perfil verificado encontrado"
              : "perfiles verificados encontrados"}
        </p>

        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#DF7B18]/40 bg-[#FEF3E7] px-3 py-1 text-xs font-bold text-[#9A4E06] transition-colors hover:bg-[#F28C28] hover:text-[#1B1E22]"
              >
                <span>{chip.label}</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              className="cursor-pointer text-xs font-bold text-[#565C64] underline-offset-2 hover:text-[#24272B] hover:underline"
            >
              {dictionary.directoryPage.clearFilters}
            </button>
          </div>
        )}
      </div>

      {initialCategoriesStatus === "error" && (
        <p className="mt-4 rounded-xl border border-[#DFD8CC] bg-[#EFEAE1] px-4 py-2 text-xs text-[#565C64]">
          {isPortuguese
            ? "Usando lista padrão de categorias enquanto reconectamos ao catálogo."
            : "Usando lista estándar de categorías mientras reconectamos al catálogo."}
        </p>
      )}

      {/* Layout principal Marketplace: Sidebar (lg+) + Grade de resultados */}
      <div className="mt-6 grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Sidebar Desktop */}
        <aside
          aria-label={
            isPortuguese ? "Filtros de busca" : "Filtros de búsqueda"
          }
          className="hidden lg:col-span-3 lg:block"
        >
          <div className="sticky top-32 rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-2xs">
            {renderFacetPanel("dir")}
          </div>
        </aside>

        {/* Resultados */}
        <div className="lg:col-span-9">
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              aria-label={
                isPortuguese
                  ? "Buscando profissionais..."
                  : "Buscando profesionales..."
              }
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl border border-[#DFD8CC] bg-white"
                />
              ))}
            </div>
          ) : status === "unconfigured" ? (
            <div className="rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
              <h2 className="text-lg font-extrabold text-[#24272B]">
                {isPortuguese
                  ? "Catálogo temporariamente indisponível"
                  : "Catálogo temporalmente no disponible"}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-[#565C64]">
                {isPortuguese
                  ? "A conexão com o diretório público não está ativa neste ambiente no momento."
                  : "La conexión con el directorio público no está activa en este entorno en este momento."}
              </p>
            </div>
          ) : status === "error" ? (
            <div
              role="alert"
              className="rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-10 text-center"
            >
              <AlertTriangle
                className="mx-auto h-9 w-9 text-[#A62C1E]"
                aria-hidden="true"
              />
              <h2 className="mt-3 text-lg font-extrabold text-[#24272B]">
                {dictionary.directoryPage.errorTitle}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-[#565C64]">
                {dictionary.directoryPage.errorDescription}
              </p>
              <div className="mt-5">
                <Button
                  variant="graphite"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => void executeSearch(urlFilters)}
                >
                  {dictionary.directoryPage.retryBtn}
                </Button>
              </div>
            </div>
          ) : result.items.length === 0 ? (
            <div className="rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
              <FilterX
                className="mx-auto h-9 w-9 text-[#F28C28]"
                aria-hidden="true"
              />
              <h2 className="mt-3 text-lg font-extrabold text-[#24272B]">
                {dictionary.directoryPage.emptyTitle}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-[#565C64]">
                {dictionary.directoryPage.emptyDescription}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {activeFilterChips.length > 0 && (
                  <Button variant="primary" onClick={handleResetFilters}>
                    {dictionary.directoryPage.clearFilters}
                  </Button>
                )}
                <Link
                  href="/cadastro?role=professional"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#CFC6B8] bg-[#F7F4EE] px-5 text-sm font-bold text-[#24272B] transition hover:border-[#F28C28] hover:text-[#A65206]"
                >
                  {dictionary.directoryPage.professionalCta}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {result.items.map((professional) => (
                  <ProfessionalCard
                    key={professional.userId}
                    professional={professional}
                  />
                ))}
              </div>

              {result.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between rounded-2xl border border-[#DFD8CC] bg-white px-5 py-3.5">
                  <span className="text-xs font-semibold text-[#565C64] tabular-nums">
                    Página {result.page} de {result.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={result.page <= 1}
                      leftIcon={<ChevronLeft className="h-4 w-4" />}
                      onClick={() =>
                        updateFilters(
                          { page: Math.max(1, result.page - 1) },
                          false
                        )
                      }
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={result.page >= result.totalPages}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                      onClick={() =>
                        updateFilters(
                          { page: Math.min(result.totalPages, result.page + 1) },
                          false
                        )
                      }
                    >
                      {isPortuguese ? "Próxima" : "Siguiente"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer acessível */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 bg-[#111316]/60 backdrop-blur-xs"
          />
          <div
            ref={drawerRef}
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label={
              isPortuguese ? "Filtros do diretório" : "Filtros del directorio"
            }
            className="fixed inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#DFD8CC] px-5 py-4">
              <h2 className="text-base font-extrabold text-[#24272B]">
                {isPortuguese ? "Filtrar profissionais" : "Filtrar profesionales"}
              </h2>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label={isPortuguese ? "Fechar filtros" : "Cerrar filtros"}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#DFD8CC] text-[#24272B] hover:bg-[#F7F4EE]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {renderFacetPanel("dir-mobile")}
            </div>
            <div className="border-t border-[#DFD8CC] bg-[#FAF8F4] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setMobileFiltersOpen(false)}
              >
                {isPortuguese
                  ? `Ver ${result.totalCount} resultados`
                  : `Ver ${result.totalCount} resultados`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
