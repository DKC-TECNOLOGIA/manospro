"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  BriefcaseBusiness,
  Pause,
  Play,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CITY_ZONES } from "@/features/i18n/regions";
import {
  fetchRealCategories,
  searchRealProfessionals,
  type RealProfessionalListItem,
} from "@/services/supabase/professionals";
import { CategoryCard } from "@/features/categories/components/CategoryCard";
import { MobileCategoryCarousel } from "@/features/categories/components/MobileCategoryCarousel";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { Button } from "@/components/ui/Button";
import type { ServiceCategory } from "@/types/domain";

export default function HomePage() {
  const router = useRouter();
  const { country, currency, dictionary, locale, regionConfig, tText } =
    useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeBanner, setActiveBanner] = useState(1);
  const [isBannerRotating, setIsBannerRotating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const [isBannerFocused, setIsBannerFocused] = useState(false);
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

  const bannerSlides = [
    {
      href: "/profissionais",
      eyebrow: dictionary.hero.clientBannerEyebrow,
      title: dictionary.hero.clientBannerTitle,
      subtitle: dictionary.hero.clientBannerSubtitle,
      cta: dictionary.hero.clientBannerCta,
      isProfessional: false,
    },
    {
      href: "/cadastro?role=professional",
      eyebrow: dictionary.hero.professionalBannerEyebrow,
      title: dictionary.hero.professionalBannerTitle,
      subtitle: dictionary.hero.professionalBannerSubtitle,
      cta: dictionary.hero.professionalBannerCta,
      isProfessional: true,
    },
  ];
  const currentBanner = bannerSlides[activeBanner] ?? bannerSlides[0]!;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(motionQuery.matches);
      setIsBannerRotating(!motionQuery.matches);
    };

    updateMotionPreference();
    motionQuery.addEventListener("change", updateMotionPreference);
    return () => motionQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (
      !isBannerRotating ||
      prefersReducedMotion ||
      isBannerHovered ||
      isBannerFocused
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % 2);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [isBannerRotating, prefersReducedMotion, isBannerHovered, isBannerFocused]);

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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <section
              aria-roledescription={locale === "es-AR" ? "carrusel" : "carrossel"}
              aria-label={locale === "es-AR" ? "Anuncios de ManosPro" : "Destaques do ManosPro"}
              className="w-full"
              onMouseEnter={() => setIsBannerHovered(true)}
              onMouseLeave={() => setIsBannerHovered(false)}
              onFocusCapture={() => setIsBannerFocused(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsBannerFocused(false);
                }
              }}
            >
              <Link
                key={activeBanner}
                href={currentBanner.href}
                aria-label={`${currentBanner.title} ${currentBanner.subtitle} ${currentBanner.cta}`}
                aria-live="off"
                className="group motion-safe:animate-[hero-banner-enter_400ms_ease-out] relative flex min-h-[500px] w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1B1E22] shadow-xl transition duration-300 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F28C28]/70 lg:aspect-[3.15/1] lg:min-h-[390px]"
              >
                <div className="relative order-2 min-h-[230px] flex-1 lg:absolute lg:inset-0 lg:order-none lg:min-h-0">
                  <Image
                    src="/hero-cadastro.png"
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1279px) 100vw, 1280px"
                    className="object-cover object-[68%_center] transition-transform duration-500 group-hover:scale-[1.02] lg:object-center"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#17191C]/15 to-transparent lg:bg-gradient-to-r lg:from-[#17191C] lg:via-[#17191C]/85 lg:to-[#17191C]/5" />
                </div>

                <div className="relative z-10 order-1 flex flex-col items-start bg-[#1B1E22] px-5 py-6 sm:px-8 sm:py-8 lg:absolute lg:inset-y-0 lg:left-0 lg:order-none lg:w-[58%] lg:justify-center lg:bg-gradient-to-r lg:from-[#17191C] lg:via-[#17191C]/95 lg:to-transparent lg:pr-14 lg:py-10">
                  <span className="mb-4 inline-flex rounded-full border border-[#F28C28]/35 bg-[#F28C28]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#FFB15F]">
                    {currentBanner.eyebrow}
                  </span>
                  <h1 className="max-w-2xl text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
                    {currentBanner.title}
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#D1CCC3] sm:text-base lg:text-lg">
                    {currentBanner.subtitle}
                  </p>
                  <span className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 text-sm font-bold text-[#1B1E22] transition-colors group-hover:bg-[#FF9C3A] sm:text-base">
                    {currentBanner.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>

              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#D1CCC3]">
                <div role="group" className="flex items-center gap-1.5" aria-label={locale === "es-AR" ? "Elegir anuncio" : "Escolher destaque"}>
                  {bannerSlides.map((slide, index) => (
                    <button
                      key={slide.href}
                      type="button"
                      aria-label={`${locale === "es-AR" ? "Mostrar anuncio" : "Mostrar destaque"} ${index + 1}: ${slide.title}`}
                      aria-pressed={activeBanner === index}
                      onClick={() => setActiveBanner(index)}
                      className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 focus-visible:ring-offset-[#24272B] ${activeBanner === index ? "w-7 bg-[#F28C28]" : "w-2.5 bg-[#777C83] hover:bg-[#CFCAC0]"}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={locale === "es-AR" ? "Anuncio anterior" : "Destaque anterior"}
                    onClick={() => setActiveBanner((activeBanner + bannerSlides.length - 1) % bannerSlides.length)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#E6E1D8] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={locale === "es-AR" ? "Próximo anuncio" : "Próximo destaque"}
                    onClick={() => setActiveBanner((activeBanner + 1) % bannerSlides.length)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#E6E1D8] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={isBannerRotating
                      ? locale === "es-AR" ? "Pausar rotación automática" : "Pausar rotação automática"
                      : prefersReducedMotion
                        ? locale === "es-AR" ? "Rotación automática desactivada por preferencia de movimiento reducido" : "Rotação automática desativada pela preferência de movimento reduzido"
                        : locale === "es-AR" ? "Iniciar rotación automática" : "Iniciar rotação automática"}
                    onClick={() => setIsBannerRotating((rotating) => !rotating)}
                    disabled={prefersReducedMotion}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#E6E1D8] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBannerRotating
                      ? <Pause className="h-4 w-4" aria-hidden="true" />
                      : <Play className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            </section>

          {/* Buscador principal conectado a `/profissionais` */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-6 rounded-2xl border border-[#3B4047] bg-[#F7F4EE] p-4 text-[#24272B] shadow-md sm:p-5"
          >
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
              <div className="lg:col-span-5">
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

              <div className="lg:col-span-3">
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

              <div className="lg:col-span-2">
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

              <div className="flex items-end lg:col-span-2">
                <Button type="submit" variant="primary" className="h-11 w-full">
                  {dictionary.hero.searchSubmit}
                </Button>
              </div>
            </div>

            <div className="mt-3.5 flex min-w-0 items-center gap-2 overflow-x-auto border-t border-[#E4DDD2] pt-3 text-xs md:flex-wrap md:overflow-visible">
              <span className="shrink-0 font-semibold text-[#5A6068]">
                {dictionary.hero.quickPopularLabel}
              </span>
              {quickTags.map((tag) => (
                <Link
                  key={tag.label}
                  href={`/categorias/${tag.slug}`}
                  className="shrink-0 whitespace-nowrap rounded-lg border border-[#D8D0C2] bg-white px-2.5 py-1 font-medium text-[#24272B] transition-colors hover:border-[#F28C28] hover:bg-[#FEF3E7]"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </form>

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
          <>
            <div className="mt-8 h-[15.5rem] animate-pulse rounded-2xl border border-[#DFD8CC] bg-white sm:hidden" />
            <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-48 animate-pulse rounded-2xl border border-[#DFD8CC] bg-white p-5"
              />
              ))}
            </div>
          </>
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
          <>
            <div className="mt-8 sm:hidden">
              <MobileCategoryCarousel categories={categories} />
            </div>
            <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 3. PROFESIONALES REALES PUBLICADOS */}
      <section className="border-y border-[#DFD8CC] bg-[#EFEAE1]/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
                {dictionary.featuredSection.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[#525860] sm:text-base">
                {dictionary.featuredSection.subtitle}
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
            <div className="mt-8 rounded-2xl border border-[#DFD8CC] bg-white p-5 sm:p-8 lg:p-10">
              <h3 className="text-lg font-bold text-[#24272B] sm:text-xl">
                {dictionary.featuredSection.emptyTitle}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#525860]">
                {dictionary.featuredSection.emptyDescription}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {!showAllCountriesInFeatured && (
                  <button
                    type="button"
                    onClick={() => setShowAllCountriesInFeatured(true)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D4CCC0] bg-white px-4 py-2.5 text-sm font-semibold text-[#24272B] hover:border-[#24272B]"
                  >
                    {dictionary.featuredSection.showAllCountries}
                  </button>
                )}
                <Link
                  href="/profissionais"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#24272B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#32363C]"
                >
                  {dictionary.featuredSection.emptyClientCta}
                </Link>
                <Link
                  href="/cadastro?role=professional"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-semibold text-[#1B1E22] hover:bg-[#DF7B18]"
                >
                  {dictionary.featuredSection.emptyProCta}
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

      {/* 5. DOIS CAMINHOS, UM DIRETÓRIO */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mb-6 max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
            {locale === "es-AR"
              ? "Un lugar para encontrar y ofrecer servicios"
              : "Um lugar para contratar e oferecer serviços"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#525860] sm:text-base">
            {locale === "es-AR"
              ? "Elegí el camino que necesitás y empezá con información clara."
              : "Escolha o caminho que você precisa e comece com informações claras."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="flex flex-col items-start rounded-2xl border border-[#DFD8CC] bg-white p-5 sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3E7] text-[#C86D14]">
              <Search className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs font-bold text-[#C86D14]">
              {dictionary.hero.clientCtaTitle}
            </p>
            <h3 className="mt-1.5 text-xl font-extrabold tracking-tight text-[#24272B] sm:text-2xl">
              {locale === "es-AR"
                ? "Encontrá a quien pueda resolver tu trabajo"
                : "Encontre quem pode resolver seu serviço"}
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#525860]">
              {dictionary.hero.clientCtaDescription}
            </p>
            <Link
              href="/profissionais"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#24272B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#32363C]"
            >
              {dictionary.hero.clientCtaLabel}
              <ArrowRight className="h-4 w-4 text-[#F28C28]" aria-hidden="true" />
            </Link>
          </article>

          <article className="flex flex-col items-start rounded-2xl bg-[#24272B] p-5 text-[#F7F4EE] sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F28C28] text-[#1B1E22]">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs font-bold text-[#F6AD65]">
              {dictionary.hero.professionalCtaTitle}
            </p>
            <h3 className="mt-1.5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              {locale === "es-AR"
                ? "Mostrá tu oficio a personas de tu zona"
                : "Mostre seu trabalho a pessoas da sua região"}
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#CFCAC0]">
              {dictionary.hero.professionalCtaDescription}
            </p>
            <Link
              href="/cadastro?role=professional"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18]"
            >
              {dictionary.hero.professionalCtaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
