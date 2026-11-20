"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe2,
  Layers,
  MapPin,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CITY_ZONES } from "@/features/i18n/regions";
import { SERVICE_CATEGORIES } from "@/features/categories/data";
import {
  fetchRealCategories,
  searchRealProfessionals,
  type RealProfessionalListItem,
} from "@/services/supabase/professionals";
import type { PublicFetchStatus } from "@/services/supabase/publicServer";
import { CategoryCard } from "@/features/categories/components/CategoryCard";
import { MobileCategoryCarousel } from "@/features/categories/components/MobileCategoryCarousel";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { Button } from "@/components/ui/Button";
import type { ServiceCategory } from "@/types/domain";

interface HomeClientProps {
  initialCategories: ServiceCategory[];
  initialCategoriesStatus: PublicFetchStatus;
  initialFeatured: RealProfessionalListItem[];
  initialFeaturedStatus: PublicFetchStatus;
}

export function HomeClient({
  initialCategories,
  initialCategoriesStatus,
  initialFeatured,
  initialFeaturedStatus,
}: HomeClientProps) {
  const router = useRouter();
  const { country, currency, dictionary, locale, regionConfig, tText } =
    useLocale();
  const isPortuguese = locale === "pt-BR";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Abre no slide de clientes (descoberta de marketplace) por padrão
  const [activeBanner, setActiveBanner] = useState(0);
  const [isBannerRotating, setIsBannerRotating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const [isBannerFocused, setIsBannerFocused] = useState(false);

  const [showAllCountriesInFeatured, setShowAllCountriesInFeatured] =
    useState(true);

  const [categories, setCategories] = useState<ServiceCategory[]>(
    initialCategories.length > 0 ? initialCategories : SERVICE_CATEGORIES
  );
  const [categoriesStatus, setCategoriesStatus] = useState<PublicFetchStatus>(
    initialCategoriesStatus
  );
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [featuredPros, setFeaturedPros] =
    useState<RealProfessionalListItem[]>(initialFeatured);
  const [prosStatus, setProsStatus] =
    useState<PublicFetchStatus>(initialFeaturedStatus);
  const [prosLoading, setProsLoading] = useState(false);

  const hasMountedFeaturedRef = useRef(false);

  const regionalCities = CITY_ZONES.filter((zone) => zone.country === country);

  const bannerSlides = [
    {
      href: "/profissionais",
      image: "/hero-trabalhadores-banner.png",
      title: dictionary.hero.clientBannerTitle,
      subtitle: dictionary.hero.clientBannerSubtitle,
      cta: dictionary.hero.clientBannerCta,
      secondaryHref: "/categorias",
      secondaryLabel: isPortuguese ? "Ver categorias" : "Explorar categorías",
    },
    {
      href: "/cadastro?role=professional",
      image: "/hero-cadastro.png",
      title: dictionary.hero.professionalBannerTitle,
      subtitle: dictionary.hero.professionalBannerSubtitle,
      cta: dictionary.hero.professionalBannerCta,
      secondaryHref: "/#como-funciona",
      secondaryLabel: dictionary.nav.howItWorks,
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
    return () =>
      motionQuery.removeEventListener("change", updateMotionPreference);
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
      setActiveBanner((current) => (current + 1) % bannerSlides.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [
    isBannerRotating,
    prefersReducedMotion,
    isBannerHovered,
    isBannerFocused,
    bannerSlides.length,
  ]);

  const reloadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await fetchRealCategories();
      if (data.length > 0) {
        setCategories(data);
      }
      setCategoriesStatus("ok");
    } catch {
      setCategoriesStatus("error");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const reloadFeatured = useCallback(
    async (targetCountry: "ALL" | "AR" | "BR") => {
      setProsLoading(true);
      try {
        const result = await searchRealProfessionals({
          country: targetCountry,
          page: 1,
          pageSize: 6,
        });
        setFeaturedPros(result.items);
        setProsStatus("ok");
      } catch {
        setProsStatus("error");
      } finally {
        setProsLoading(false);
      }
    },
    []
  );

  // Só refaz busca no cliente quando o usuário troca o escopo de país após o SSR inicial
  useEffect(() => {
    if (!hasMountedFeaturedRef.current) {
      hasMountedFeaturedRef.current = true;
      return;
    }
    void reloadFeatured(showAllCountriesInFeatured ? "ALL" : country);
  }, [country, showAllCountriesInFeatured, reloadFeatured]);

  const handleHeroSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedCity !== "all") params.set("city", selectedCity);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    const qs = params.toString();
    router.push(qs ? `/profissionais?${qs}` : "/profissionais");
  };

  const quickTags = isPortuguese
    ? [
        { label: "Eletricista", href: "/profissionais?category=electricidad-y-gas&q=Eletricista" },
        { label: "Encanador", href: "/profissionais?category=hogar&q=Encanador" },
        { label: "Pintor e Drywall", href: "/profissionais?category=construccion&q=Pintor" },
        { label: "Marceneiro", href: "/profissionais?category=hogar&q=Marceneiro" },
        { label: "Fretes e Mudanças", href: "/categorias/transporte" },
        { label: "Jardinagem", href: "/categorias/jardineria" },
      ]
    : [
        { label: "Gasista matriculado", href: "/profissionais?category=electricidad-y-gas&q=Gasista" },
        { label: "Plomero", href: "/profissionais?category=hogar&q=Plomero" },
        { label: "Electricista", href: "/profissionais?category=electricidad-y-gas&q=Electricista" },
        { label: "Pintor de obra", href: "/profissionais?category=construccion&q=Pintor" },
        { label: "Fletes y mudanzas", href: "/categorias/transporte" },
        { label: "Jardinería", href: "/categorias/jardineria" },
      ];

  const trustItems = isPortuguese
    ? [
        {
          icon: ShieldCheck,
          title: "Perfis verificados",
          desc: "Cadastro revisado antes da publicação no diretório.",
        },
        {
          icon: FileText,
          title: "Orçamento sem compromisso",
          desc: "Descreva seu serviço e compare propostas em moeda local.",
        },
        {
          icon: MessageSquare,
          title: "Chat privado integrado",
          desc: "Combine detalhes e envie fotos com acesso restrito.",
        },
        {
          icon: Globe2,
          title: "Brasil e Argentina",
          desc: "Valores de referência claros em BRL e ARS.",
        },
      ]
    : [
        {
          icon: ShieldCheck,
          title: "Perfiles verificados",
          desc: "Revisión previa antes de publicar en el directorio.",
        },
        {
          icon: FileText,
          title: "Presupuesto sin compromiso",
          desc: "Describí tu trabajo y recibí propuestas en moneda local.",
        },
        {
          icon: MessageSquare,
          title: "Chat privado integrado",
          desc: "Coordiná detalles y enviá fotos en espacio protegido.",
        },
        {
          icon: Globe2,
          title: "Argentina y Brasil",
          desc: "Valores orientativos claros en ARS y BRL.",
        },
      ];

  return (
    <div>
      {/* 1. HERO MARKETPLACE + BUSCADOR EM DESTAQUE */}
      <section className="relative border-b border-[#DFD8CC] bg-[#24272B] text-[#F7F4EE]">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10">
          {/* Banner rotativo acessível */}
          <div
            role="region"
            aria-roledescription={isPortuguese ? "carrossel" : "carrusel"}
            aria-label={
              isPortuguese ? "Destaques do ManosPro" : "Anuncios de ManosPro"
            }
            onMouseEnter={() => setIsBannerHovered(true)}
            onMouseLeave={() => setIsBannerHovered(false)}
            onFocusCapture={() => setIsBannerFocused(true)}
            onBlurCapture={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null
                )
              ) {
                setIsBannerFocused(false);
              }
            }}
          >
            <div
              key={activeBanner}
              className="motion-safe:animate-[hero-banner-enter_360ms_ease-out] relative flex min-h-[340px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1B1E22] shadow-xl lg:min-h-[360px] lg:flex-row"
            >
              <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 lg:w-[56%] lg:bg-gradient-to-r lg:from-[#17191C] lg:via-[#17191C]/96 lg:to-transparent lg:py-10 lg:pr-12">
                <h1 className="max-w-xl text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">
                  {currentBanner.title}
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#D4CFC6] sm:text-base">
                  {currentBanner.subtitle}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={currentBanner.href}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-2.5 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1E22]"
                  >
                    <span>{currentBanner.cta}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href={currentBanner.secondaryHref}
                    className="inline-flex min-h-11 items-center rounded-xl border border-white/25 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                  >
                    {currentBanner.secondaryLabel}
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[190px] flex-1 lg:absolute lg:inset-0">
                <Image
                  src={currentBanner.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1279px) 100vw, 1280px"
                  className="object-cover object-top lg:object-[78%_center]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#17191C]/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#17191C] lg:via-[#17191C]/82 lg:to-[#17191C]/10"
                />
              </div>
            </div>

            {/* Controles do carrossel */}
            <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-[#D1CCC3]">
              <div
                role="group"
                className="flex items-center gap-1.5"
                aria-label={
                  isPortuguese ? "Escolher destaque" : "Elegir anuncio"
                }
              >
                {bannerSlides.map((slide, index) => (
                  <button
                    key={slide.href}
                    type="button"
                    aria-label={`${isPortuguese ? "Mostrar destaque" : "Mostrar anuncio"} ${index + 1}: ${slide.title}`}
                    aria-pressed={activeBanner === index}
                    onClick={() => setActiveBanner(index)}
                    className={`h-2 cursor-pointer rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] ${
                      activeBanner === index
                        ? "w-7 bg-[#F28C28]"
                        : "w-2.5 bg-[#777C83] hover:bg-[#CFCAC0]"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={
                    isPortuguese ? "Destaque anterior" : "Anuncio anterior"
                  }
                  onClick={() =>
                    setActiveBanner(
                      (activeBanner + bannerSlides.length - 1) %
                        bannerSlides.length
                    )
                  }
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#E6E1D8] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={
                    isPortuguese ? "Próximo destaque" : "Próximo anuncio"
                  }
                  onClick={() =>
                    setActiveBanner((activeBanner + 1) % bannerSlides.length)
                  }
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#E6E1D8] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={
                    isBannerRotating
                      ? isPortuguese
                        ? "Pausar rotação automática"
                        : "Pausar rotación automática"
                      : prefersReducedMotion
                        ? isPortuguese
                          ? "Rotação automática desativada pela preferência de movimento reduzido"
                          : "Rotación automática desactivada por preferencia de movimiento reducido"
                        : isPortuguese
                          ? "Iniciar rotação automática"
                          : "Iniciar rotación automática"
                  }
                  onClick={() => setIsBannerRotating((rotating) => !rotating)}
                  disabled={prefersReducedMotion}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#E6E1D8] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBannerRotating ? (
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Buscador avançado conectado ao diretório */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-5 rounded-2xl border border-[#DFD8CC] bg-[#F7F4EE] p-4 text-[#24272B] shadow-lg sm:p-5"
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
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
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={dictionary.hero.searchProfessionPlaceholder}
                    className="h-11 w-full rounded-xl border border-[#CFC6B8] bg-white pr-3.5 pl-10 text-sm text-[#24272B] placeholder:text-[#6E747D] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/30"
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
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#A65206]"
                    aria-hidden="true"
                  />
                  <select
                    id="hero-search-zone"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#CFC6B8] bg-white pr-3 pl-9 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/30"
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
                    className="h-11 w-full rounded-xl border border-[#CFC6B8] bg-white pr-2 pl-9 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/30"
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
                  {isPortuguese ? "Buscar" : "Buscar"}
                </Button>
              </div>
            </div>

            {/* Buscas populares */}
            <div className="no-scrollbar mt-3.5 flex items-center gap-2 overflow-x-auto border-t border-[#E4DDD2] pt-3 text-xs md:flex-wrap md:overflow-visible">
              <span className="shrink-0 font-bold text-[#565C64]">
                {dictionary.hero.quickPopularLabel}
              </span>
              {quickTags.map((tag) => (
                <Link
                  key={tag.label}
                  href={tag.href}
                  className="shrink-0 whitespace-nowrap rounded-lg border border-[#D8D0C2] bg-white px-2.5 py-1 font-semibold text-[#24272B] transition-colors hover:border-[#F28C28] hover:bg-[#FEF3E7] hover:text-[#9A4E06]"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* 2. FAIXA DE CONFIANÇA (ESTILO MARKETPLACE) */}
      <section
        aria-label={
          isPortuguese ? "Diferenciais do ManosPro" : "Ventajas de ManosPro"
        }
        className="border-b border-[#DFD8CC] bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF3E7] text-[#A65206]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-[#24272B]">
                      {item.title}
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#565C64]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. ATALHOS RÁPIDOS + GRADE DE CATEGORIAS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
              {dictionary.categoriesSection.title}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-[#565C64] sm:text-base">
              {dictionary.categoriesSection.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/categorias"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#CFC6B8] bg-white px-4 text-xs font-bold text-[#24272B] transition-colors hover:border-[#24272B] sm:text-sm"
            >
              <span>
                {isPortuguese ? "Todas as categorias" : "Todas las categorías"}
              </span>
              <ArrowRight
                className="h-4 w-4 text-[#A65206]"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* Rail compacto de ícones (acesso instantâneo em mobile/tablet) */}
        <div className="no-scrollbar mt-6 flex gap-2.5 overflow-x-auto pb-1 lg:hidden">
          {categories.map((category) => (
            <Link
              key={`rail-${category.id}`}
              href={`/categorias/${category.slug}`}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-[#DFD8CC] bg-white px-3 py-2 text-xs font-bold text-[#24272B] shadow-2xs transition-colors hover:border-[#F28C28]"
            >
              <CategoryIcon
                name={category.iconName}
                className="h-4 w-4 text-[#A65206]"
              />
              <span className="whitespace-nowrap">{tText(category.name)}</span>
            </Link>
          ))}
        </div>

        {categoriesStatus === "error" && categories.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-8 text-center">
            <AlertTriangle
              className="mx-auto h-8 w-8 text-[#A62C1E]"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-bold text-[#24272B]">
              {isPortuguese
                ? "Não foi possível carregar as categorias no momento."
                : "No se pudieron cargar las categorías en este momento."}
            </p>
            <div className="mt-4">
              <Button
                variant="graphite"
                size="sm"
                isLoading={categoriesLoading}
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => void reloadCategories()}
              >
                {dictionary.directoryPage.retryBtn}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 sm:hidden">
              <MobileCategoryCarousel categories={categories} />
            </div>
            <div className="mt-7 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 4. VITRINE DE PROFISSIONAIS VERIFICADOS PUBLICADOS */}
      <section className="border-y border-[#DFD8CC] bg-[#EFEAE1]/75 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
                {dictionary.featuredSection.title}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-[#565C64] sm:text-base">
                {dictionary.featuredSection.subtitle}
              </p>
            </div>

            <div
              role="group"
              aria-label={
                isPortuguese
                  ? "Filtrar vitrine por país"
                  : "Filtrar vitrina por país"
              }
              className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D8D0C2] bg-white p-1"
            >
              <button
                type="button"
                aria-pressed={!showAllCountriesInFeatured}
                onClick={() => setShowAllCountriesInFeatured(false)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  !showAllCountriesInFeatured
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "text-[#565C64] hover:text-[#24272B]"
                }`}
              >
                {regionConfig.countryName[locale]} ({currency})
              </button>
              <button
                type="button"
                aria-pressed={showAllCountriesInFeatured}
                onClick={() => setShowAllCountriesInFeatured(true)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  showAllCountriesInFeatured
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "text-[#565C64] hover:text-[#24272B]"
                }`}
              >
                {dictionary.featuredSection.showAllCountries}
              </button>
            </div>
          </div>

          {prosLoading ? (
            <div
              role="status"
              aria-label={
                isPortuguese
                  ? "Carregando profissionais..."
                  : "Cargando profesionales..."
              }
              className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl border border-[#DFD8CC] bg-white p-5"
                />
              ))}
            </div>
          ) : prosStatus === "unconfigured" ? (
            <div className="mt-7 rounded-2xl border border-[#DFD8CC] bg-white p-8 text-center">
              <p className="text-sm font-bold text-[#24272B]">
                {isPortuguese
                  ? "O diretório público está temporariamente indisponível neste ambiente."
                  : "El directorio público no está disponible temporalmente en este entorno."}
              </p>
            </div>
          ) : prosStatus === "error" ? (
            <div
              role="alert"
              className="mt-7 rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-8 text-center"
            >
              <AlertTriangle
                className="mx-auto h-7 w-7 text-[#A62C1E]"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-bold text-[#24272B]">
                {dictionary.directoryPage.errorTitle}
              </p>
              <p className="mt-1 text-xs text-[#565C64]">
                {dictionary.directoryPage.errorDescription}
              </p>
              <div className="mt-4">
                <Button
                  variant="graphite"
                  size="sm"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() =>
                    void reloadFeatured(
                      showAllCountriesInFeatured ? "ALL" : country
                    )
                  }
                >
                  {dictionary.directoryPage.retryBtn}
                </Button>
              </div>
            </div>
          ) : featuredPros.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-[#DFD8CC] bg-white p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <h3 className="text-lg font-extrabold text-[#24272B] sm:text-xl">
                    {dictionary.featuredSection.emptyTitle}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#565C64]">
                    {dictionary.featuredSection.emptyDescription}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {!showAllCountriesInFeatured && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllCountriesInFeatured(true)}
                    >
                      {dictionary.featuredSection.showAllCountries}
                    </Button>
                  )}
                  <Link
                    href="/profissionais"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#24272B] px-4 text-sm font-semibold text-white hover:bg-[#32363C]"
                  >
                    {dictionary.featuredSection.emptyClientCta}
                  </Link>
                  <Link
                    href="/cadastro?role=professional"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F28C28] px-4 text-sm font-bold text-[#1B1E22] hover:bg-[#DF7B18]"
                  >
                    {dictionary.featuredSection.emptyProCta}
                  </Link>
                </div>
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#24272B] px-6 text-sm font-semibold text-[#F7F4EE] transition-colors hover:bg-[#32363C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
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

      {/* 5. COMO FUNCIONA + MODELOS DE CONTRATAÇÃO */}
      <section
        id="como-funciona"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
            {dictionary.howItWorksSection.title}
          </h2>
          <p className="mt-1.5 text-sm text-[#565C64] sm:text-base">
            {dictionary.howItWorksSection.subtitle}
          </p>
        </div>

        <ol className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              step: "1",
              title: dictionary.howItWorksSection.step1Title,
              desc: dictionary.howItWorksSection.step1Desc,
            },
            {
              step: "2",
              title: dictionary.howItWorksSection.step2Title,
              desc: dictionary.howItWorksSection.step2Desc,
            },
            {
              step: "3",
              title: dictionary.howItWorksSection.step3Title,
              desc: dictionary.howItWorksSection.step3Desc,
            },
          ].map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-[#DFD8CC] bg-white p-6"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF3E7] font-mono text-sm font-bold text-[#9A4E06]">
                {item.step}
              </span>
              <h3 className="mt-4 text-base font-extrabold text-[#24272B]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#565C64]">
                {item.desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl border border-[#D8D0C2] bg-[#EFEAE1] p-6 sm:p-7">
          <h3 className="text-base font-extrabold text-[#24272B] sm:text-lg">
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
                <p className="mt-1 text-sm text-[#565C64]">
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
                <p className="mt-1 text-sm text-[#565C64]">
                  {dictionary.howItWorksSection.quoteRequestDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DOIS CAMINHOS: CONTRATAR OU OFERECER SERVIÇOS */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <article className="flex flex-col items-start justify-between rounded-2xl border border-[#DFD8CC] bg-white p-6 sm:p-8">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3E7] text-[#A65206]">
                <Search className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-extrabold tracking-tight text-[#24272B] sm:text-2xl">
                {isPortuguese
                  ? "Encontre quem pode resolver seu serviço"
                  : "Encontrá a quien pueda resolver tu trabajo"}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#565C64]">
                {dictionary.hero.clientCtaDescription}
              </p>
            </div>
            <Link
              href="/profissionais"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#24272B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#32363C]"
            >
              <span>{dictionary.hero.clientCtaLabel}</span>
              <ArrowRight className="h-4 w-4 text-[#F28C28]" aria-hidden="true" />
            </Link>
          </article>

          <article className="flex flex-col items-start justify-between rounded-2xl bg-[#24272B] p-6 text-[#F7F4EE] sm:p-8">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F28C28] text-[#1B1E22]">
                <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {isPortuguese
                  ? "Mostre seu trabalho a pessoas da sua região"
                  : "Mostrá tu oficio a personas de tu zona"}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#CFCAC0]">
                {dictionary.hero.professionalCtaDescription}
              </p>
            </div>
            <Link
              href="/cadastro?role=professional"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F28C28] px-5 py-2.5 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18]"
            >
              <span>{dictionary.hero.professionalCtaLabel}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
