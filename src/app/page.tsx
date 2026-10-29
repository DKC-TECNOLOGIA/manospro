"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coins,
  FileText,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CITY_ZONES } from "@/features/i18n/regions";
import {
  fetchRealCategories,
  searchRealProfessionals,
  type RealProfessionalListItem,
} from "@/services/supabase/professionals";
import { CategoryCard } from "@/features/categories/components/CategoryCard";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ManosProLogo } from "@/components/ui/ManosProLogo";
import type { ServiceCategory } from "@/types/domain";

export default function HomePage() {
  const router = useRouter();
  const { country, currency, dictionary, locale, regionConfig, tText } =
    useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllCountriesInFeatured, setShowAllCountriesInFeatured] =
    useState(true);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [featuredPros, setFeaturedPros] = useState<RealProfessionalListItem[]>(
    []
  );
  const [prosLoading, setProsLoading] = useState(true);
  const [prosError, setProsError] = useState<string | null>(null);

  const regionalCities = CITY_ZONES.filter((zone) => zone.country === country);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchRealCategories();
      setCategories(data);
      setCategoriesError(null);
    } catch (err) {
      setCategoriesError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las categorías."
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadFeaturedProfessionals = useCallback(async () => {
    try {
      const result = await searchRealProfessionals({
        country: showAllCountriesInFeatured ? "ALL" : country,
        page: 1,
        pageSize: 6,
      });
      setFeaturedPros(result.items);
      setProsError(null);
    } catch (err) {
      setProsError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los perfiles profesionales."
      );
    } finally {
      setProsLoading(false);
    }
  }, [country, showAllCountriesInFeatured]);

  useEffect(() => {
    let active = true;
    fetchRealCategories()
      .then((data) => {
        if (!active) return;
        setCategories(data);
        setCategoriesError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setCategoriesError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las categorías."
        );
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    searchRealProfessionals({
      country: showAllCountriesInFeatured ? "ALL" : country,
      page: 1,
      pageSize: 6,
    })
      .then((result) => {
        if (!active) return;
        setFeaturedPros(result.items);
        setProsError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setProsError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los perfiles profesionales."
        );
      })
      .finally(() => {
        if (active) setProsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [country, showAllCountriesInFeatured]);

  const handleHeroSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedCity !== "all") params.set("city", selectedCity);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    const qs = params.toString();
    router.push(qs ? `/profissionais?${qs}` : "/profissionais");
  };

  const quickTags =
    locale === "es-AR"
      ? [
          { label: "Gasista matriculado", slug: "electricidad-y-gas" },
          { label: "Plomero", slug: "hogar" },
          { label: "Pintor de obra", slug: "construccion" },
          { label: "Fletes y mudanzas", slug: "transporte" },
          { label: "Jardinería", slug: "jardineria" },
        ]
      : [
          { label: "Eletricista", slug: "electricidad-y-gas" },
          { label: "Encanador / Hidráulica", slug: "hogar" },
          { label: "Pintor e Drywall", slug: "construccion" },
          { label: "Marceneiro", slug: "hogar" },
          { label: "Paisagismo", slug: "jardineria" },
        ];

  return (
    <div>
      {/* 1. HERO CON BÚSQUEDA Y SELECCIÓN DE ZONA + CATEGORÍA */}
      <section className="relative border-b border-[#DFD8CC] bg-[#24272B] text-[#F7F4EE]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <Badge variant="orange" className="mb-4">
                {dictionary.hero.badge}
              </Badge>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.12]">
                {dictionary.hero.title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#CFCAC0] sm:text-lg">
                {dictionary.hero.subtitle}
              </p>
            </div>

            {/* Mosaico de fotos dos profissionais reais no Hero */}
            <div className="shrink-0 flex items-center gap-3 rounded-2xl border border-[#3B4047] bg-[#1C1F23]/90 p-4 shadow-xl">
              <div className="flex -space-x-3 overflow-hidden">
                {featuredPros.length > 0
                  ? featuredPros.slice(0, 5).map((pro) => (
                      <Link
                        key={pro.userId}
                        href={`/profissionais/${pro.slug}`}
                        title={`${pro.fullName} — ${pro.primarySpecialtyEsAr || pro.primarySpecialtyPtBr}`}
                        className="relative inline-block transition-transform hover:z-10 hover:scale-115"
                      >
                        {pro.avatarUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={pro.avatarUrl}
                            alt={pro.fullName}
                            className="h-14 w-14 rounded-full border-2 border-[#24272B] object-cover bg-[#EFEAE1] shadow-md"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#24272B] bg-[#F28C28] text-sm font-bold text-[#1B1E22]">
                            {pro.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </Link>
                    ))
                  : [
                      {
                        name: "Diego Santoro",
                        img: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=80",
                      },
                      {
                        name: "Valeria Benítez",
                        img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
                      },
                      {
                        name: "Matías Rossi",
                        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
                      },
                      {
                        name: "Camila Duarte",
                        img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
                      },
                      {
                        name: "Rodrigo Silva",
                        img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
                      },
                    ].map((sample) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={sample.name}
                        src={sample.img}
                        alt={sample.name}
                        className="h-14 w-14 rounded-full border-2 border-[#24272B] object-cover bg-[#EFEAE1] shadow-md"
                      />
                    ))}
              </div>

              <div className="pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    {locale === "es-AR" ? "Profesionales online" : "Profissionais online"}
                  </p>
                </div>
                <p className="text-[11px] text-[#A69F94]">
                  {locale === "es-AR"
                    ? "Plomeros, electricistas, obras y más"
                    : "Eletricistas, pedreiros, reformas e mais"}
                </p>
              </div>
            </div>
          </div>

          {/* Buscador principal conectado a `/profissionais` */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 rounded-2xl border border-[#3B4047] bg-[#F7F4EE] p-4 text-[#24272B] shadow-md sm:p-5"
          >
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
              <div className="md:col-span-5">
                <label
                  htmlFor="hero-search-query"
                  className="mb-1.5 block text-xs font-bold text-[#24272B]"
                >
                  {dictionary.hero.searchProfessionLabel}
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#686E77]"
                    aria-hidden="true"
                  />
                  <input
                    id="hero-search-query"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={dictionary.hero.searchProfessionPlaceholder}
                    className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white pr-3.5 pl-10 text-sm text-[#24272B] placeholder:text-[#7D838C] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/30"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label
                  htmlFor="hero-search-zone"
                  className="mb-1.5 block text-xs font-bold text-[#24272B]"
                >
                  {dictionary.hero.searchZoneLabel} (
                  {regionConfig.countryName[locale]})
                </label>
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#F28C28]"
                    aria-hidden="true"
                  />
                  <select
                    id="hero-search-zone"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white pr-3 pl-9 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/30"
                  >
                    <option value="all">{dictionary.hero.searchZoneAll}</option>
                    {regionalCities.map((zone) => (
                      <option key={zone.id} value={zone.city}>
                        {zone.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="hero-search-category"
                  className="mb-1.5 block text-xs font-bold text-[#24272B]"
                >
                  {dictionary.hero.searchCategoryLabel}
                </label>
                <div className="relative">
                  <Layers
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#686E77]"
                    aria-hidden="true"
                  />
                  <select
                    id="hero-search-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white pr-2 pl-9 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/30"
                  >
                    <option value="all">
                      {dictionary.hero.searchCategoryAll}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {tText(cat.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end md:col-span-2">
                <Button type="submit" variant="primary" className="h-11 w-full">
                  {dictionary.hero.searchSubmit}
                </Button>
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[#E4DDD2] pt-3 text-xs">
              <span className="font-semibold text-[#5A6068]">
                {dictionary.hero.quickPopularLabel}
              </span>
              {quickTags.map((tag) => (
                <Link
                  key={tag.label}
                  href={`/categorias/${tag.slug}`}
                  className="rounded-lg border border-[#D8D0C2] bg-white px-2.5 py-1 font-medium text-[#24272B] transition-colors hover:border-[#F28C28] hover:bg-[#FEF3E7]"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </form>

          {/* 3 Pilares com Avatares dos Profissionais de Destaque */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#3B4047] bg-[#1C1F23]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 overflow-hidden">
                {featuredPros.slice(0, 5).map((pro) => (
                  <Link
                    key={pro.userId}
                    href={`/profissionais/${pro.slug}`}
                    title={`${pro.fullName} — ${pro.primarySpecialtyEsAr || pro.primarySpecialtyPtBr}`}
                    className="relative inline-block transition-transform hover:z-10 hover:scale-110"
                  >
                    {pro.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={pro.avatarUrl}
                        alt={pro.fullName}
                        className="h-12 w-12 rounded-full border-2 border-[#24272B] object-cover bg-[#EFEAE1] shadow-sm"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#24272B] bg-[#F28C28] text-xs font-bold text-[#1B1E22]">
                        {pro.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  {locale === "es-AR"
                    ? "+8 especialistas verificados en CABA y São Paulo"
                    : "+8 especialistas verificados em São Paulo e Buenos Aires"}
                </p>
                <p className="text-xs text-[#B9B3A9]">
                  {locale === "es-AR"
                    ? "Plomería, gas, construcción, jardinería, fletes, belleza y salud."
                    : "Hidráulica, elétrica, reformas, jardinagem, fretes, estética e saúde."}
                </p>
              </div>
            </div>

            <Link
              href="/profissionais"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#F28C28] px-4 text-xs font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18]"
            >
              <span>
                {locale === "es-AR"
                  ? "Ver todos los perfiles"
                  : "Ver todos os perfis"}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. GRILLA DE CATEGORÍAS REALES DESDE SUPABASE */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
              {dictionary.categoriesSection.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#525860] sm:text-base">
              {dictionary.categoriesSection.subtitle}
            </p>
          </div>
          <Link
            href="/profissionais"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4CCC0] bg-white px-4 py-2.5 text-sm font-semibold text-[#24272B] transition-colors hover:border-[#24272B]"
          >
            <span>{dictionary.categoriesSection.viewAllProfessionals}</span>
            <ArrowRight
              className="h-4 w-4 text-[#F28C28]"
              aria-hidden="true"
            />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-48 animate-pulse rounded-2xl border border-[#DFD8CC] bg-white p-5"
              />
            ))}
          </div>
        ) : categoriesError ? (
          <div className="mt-8 rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-[#B93829]" />
            <p className="mt-2 text-sm font-bold text-[#24272B]">
              {categoriesError}
            </p>
            <div className="mt-4">
              <Button
                variant="graphite"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => void loadCategories()}
              >
                {dictionary.directoryPage.retryBtn}
              </Button>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
            <p className="text-base font-bold text-[#24272B]">
              {locale === "es-AR"
                ? "No hay categorías activas registradas en la base de datos."
                : "Não há categorias ativas cadastradas no banco de dados."}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* 3. SECCIÓN DE PROFESIONALES PUBLICADOS EN SUPABASE */}
      <section className="border-y border-[#DFD8CC] bg-[#EFEAE1]/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <Badge variant="emerald" className="mb-2">
                {locale === "es-AR"
                  ? "Datos en vivo desde Supabase"
                  : "Dados reais do Supabase"}
              </Badge>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
                {locale === "es-AR"
                  ? "Profesionales publicados en el directorio"
                  : "Profissionais publicados no diretório"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[#525860] sm:text-base">
                {locale === "es-AR"
                  ? "Perfiles públicos activos consultados directamente desde PostgreSQL con políticas RLS."
                  : "Perfis públicos ativos consultados diretamente no PostgreSQL com políticas RLS."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllCountriesInFeatured(false)}
                className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                  !showAllCountriesInFeatured
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "border border-[#D4CCC0] bg-white text-[#24272B]"
                }`}
              >
                {dictionary.featuredSection.filterByCurrentCountry}{" "}
                {regionConfig.countryName[locale]} ({currency})
              </button>
              <button
                type="button"
                onClick={() => setShowAllCountriesInFeatured(true)}
                className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                  showAllCountriesInFeatured
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "border border-[#D4CCC0] bg-white text-[#24272B]"
                }`}
              >
                {dictionary.featuredSection.showAllCountries}
              </button>
            </div>
          </div>

          {prosLoading ? (
            <div className="mt-8 rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#F28C28]" />
            </div>
          ) : prosError ? (
            <div className="mt-8 rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-8 text-center">
              <p className="text-sm font-bold text-[#B93829]">{prosError}</p>
              <div className="mt-3">
                <Button
                  variant="graphite"
                  size="sm"
                  onClick={() => void loadFeaturedProfessionals()}
                >
                  {dictionary.directoryPage.retryBtn}
                </Button>
              </div>
            </div>
          ) : featuredPros.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
              <p className="text-base font-bold text-[#24272B]">
                {locale === "es-AR"
                  ? "Todavía no hay perfiles publicados para este filtro de país."
                  : "Ainda não há perfis publicados para este filtro de país."}
              </p>
              <div className="mt-4 flex justify-center gap-3">
                {!showAllCountriesInFeatured && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllCountriesInFeatured(true)}
                  >
                    {dictionary.featuredSection.showAllCountries}
                  </Button>
                )}
                <Link href="/profissional">
                  <Button variant="primary" size="sm">
                    {dictionary.proCtaSection.primaryCta}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredPros.map((pro) => (
                <ProfessionalCard key={pro.userId} professional={pro} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/profissionais"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#24272B] px-6 text-sm font-semibold text-[#F7F4EE] transition-colors hover:bg-[#32363C]"
            >
              <span>{dictionary.featuredSection.viewFullDirectory}</span>
              <ArrowRight
                className="h-4 w-4 text-[#F28C28]"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CÓMO FUNCIONA LA PLATAFORMA + 2 MODELOS DE CONTRATACIÓN */}
      <section
        id="como-funciona"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
            {dictionary.howItWorksSection.title}
          </h2>
          <p className="mt-2 text-sm text-[#525860] sm:text-base">
            {dictionary.howItWorksSection.subtitle}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF3E7] font-mono text-sm font-bold text-[#C86D14]">
              01
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#24272B]">
              {dictionary.howItWorksSection.step1Title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#525860]">
              {dictionary.howItWorksSection.step1Desc}
            </p>
          </div>

          <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF3E7] font-mono text-sm font-bold text-[#C86D14]">
              02
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#24272B]">
              {dictionary.howItWorksSection.step2Title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#525860]">
              {dictionary.howItWorksSection.step2Desc}
            </p>
          </div>

          <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF3E7] font-mono text-sm font-bold text-[#C86D14]">
              03
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#24272B]">
              {dictionary.howItWorksSection.step3Title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#525860]">
              {dictionary.howItWorksSection.step3Desc}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#D8D0C2] bg-[#EFEAE1] p-6 sm:p-8">
          <h3 className="text-lg font-bold text-[#24272B]">
            {dictionary.howItWorksSection.hiringModelsTitle}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3.5 rounded-xl border border-[#DFD8CC] bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#24272B] text-[#F28C28]">
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-[#24272B]">
                  {dictionary.howItWorksSection.directContactTitle}
                </h4>
                <p className="mt-1 text-sm text-[#525860]">
                  {dictionary.howItWorksSection.directContactDesc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-[#DFD8CC] bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F28C28] text-[#1B1E22]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-[#24272B]">
                  {dictionary.howItWorksSection.quoteRequestTitle}
                </h4>
                <p className="mt-1 text-sm text-[#525860]">
                  {dictionary.howItWorksSection.quoteRequestDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. IDENTIDAD VISUAL & LOGOTIPO ORIGINAL */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <Badge variant="cream">Design System · ManosPro</Badge>
              <h2 className="mt-2 text-xl font-extrabold text-[#24272B] sm:text-2xl">
                {locale === "es-AR"
                  ? "Identidad visual y logotipo original ManosPro"
                  : "Identidade visual e logotipo original ManosPro"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#525860]">
                {locale === "es-AR"
                  ? "El isotipo une el arco técnico de hogar/herramienta en naranja (#F28C28), la letra 'M' de Manos en creme (#F7F4EE) y el escudo octogonal en grafite (#24272B)."
                  : "O símbolo une o arco técnico de casa/ferramenta em laranja (#F28C28), a letra 'M' de Manos em creme (#F7F4EE) e a base octogonal em grafite (#24272B)."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6">
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#E4DDD2] bg-[#F7F4EE] p-6">
                <ManosProLogo
                  variant="dark-on-light"
                  size="lg"
                  showSlogan
                  sloganText={dictionary.brand.slogan}
                />
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-[#24272B] p-6">
                <ManosProLogo
                  variant="light-on-dark"
                  size="lg"
                  showSlogan
                  sloganText={dictionary.brand.slogan}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LLAMADA A LA ACCIÓN PARA PROFESIONALES AUTÓNOMOS */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#24272B] p-8 text-[#F7F4EE] shadow-sm sm:p-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <Badge variant="orange">{dictionary.proCtaSection.tag}</Badge>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {dictionary.proCtaSection.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#CFCAC0] sm:text-base">
                {dictionary.proCtaSection.subtitle}
              </p>

              <ul className="mt-5 space-y-2 text-sm text-[#E4DFD7]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-[#F28C28]"
                    aria-hidden="true"
                  />
                  <span>{dictionary.proCtaSection.benefit1}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-[#F28C28]"
                    aria-hidden="true"
                  />
                  <span>{dictionary.proCtaSection.benefit2}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-[#F28C28]"
                    aria-hidden="true"
                  />
                  <span>{dictionary.proCtaSection.benefit3}</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-4">
              <Link
                href="/profissional"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#F28C28] px-6 text-base font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18]"
              >
                {locale === "es-AR"
                  ? "Crear o editar mi perfil profesional"
                  : "Criar ou editar meu perfil profissional"}
              </Link>
              <Link
                href="/cadastro?role=professional"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#454B54] bg-[#2E3238] px-5 text-sm font-semibold text-[#F7F4EE] transition-colors hover:bg-[#383D44]"
              >
                {dictionary.proCtaSection.primaryCta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
