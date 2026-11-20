"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Compass,
  LayoutGrid,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  UserCircle2,
  X,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CITY_ZONES } from "@/features/i18n/regions";
import { useAuth } from "@/features/auth/AuthProvider";
import { AccountMenu } from "@/features/auth/components/AccountMenu";
import { ManosProLogo } from "@/components/ui/ManosProLogo";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { NotificationsBell } from "@/features/messaging/components/NotificationsBell";
import { SERVICE_CATEGORIES } from "@/features/categories/data";
import { cn } from "@/lib/utils";
import type { CountryCode } from "@/types/domain";

export function SiteHeader() {
  const { country, currency, dictionary, locale, setCountry, tText } = useLocale();
  const {
    user,
    isLoading,
    isResolvingAccount,
    accountHref,
    isAdmin,
    avatarUrl,
    profileName,
    signOut,
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("all");

  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const categoriesButtonRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasMobileOpenRef = useRef(false);

  const categoriesMenuId = useId();
  const mobileDrawerId = useId();

  const isPortuguese = locale === "pt-BR";
  const brandTagline = isPortuguese
    ? "Profissionais verificados perto de você"
    : "Profesionales verificados cerca de vos";

  const regionalCities = CITY_ZONES.filter((zone) => zone.country === country);

  const handleRegionChange = (nextCountry: CountryCode) => {
    setCountry(nextCountry);
    setSearchCity("all");
  };

  const handleGlobalSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (searchCity !== "all") params.set("city", searchCity);
    const qs = params.toString();
    setMobileMenuOpen(false);
    setCategoriesOpen(false);
    router.push(qs ? `/profissionais?${qs}` : "/profissionais");
  };

  // Close menus on outside click or Escape
  useEffect(() => {
    if (!categoriesOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!categoriesMenuRef.current?.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCategoriesOpen(false);
        categoriesButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoriesOpen]);

  // Mobile drawer Escape, focus trap, scroll lock, and focus restoration
  useEffect(() => {
    if (mobileMenuOpen) {
      wasMobileOpenRef.current = true;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      mobileCloseRef.current?.focus();

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setMobileMenuOpen(false);
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

    if (wasMobileOpenRef.current) {
      wasMobileOpenRef.current = false;
      mobileToggleRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const accountPending = isLoading || (user !== null && isResolvingAccount);

  const isDirectoryActive = pathname.startsWith("/profissionais");
  const isCategoriesActive = pathname.startsWith("/categorias");

  return (
    <header className="sticky top-0 z-40 w-full bg-[#24272B] text-[#E6E1D8] shadow-[0_6px_24px_rgba(12,14,17,0.22)]">
      {/* FAIXA 1: MARCA + BUSCA GLOBAL + CONTA / CTA */}
      <div className="border-b border-[#32373E]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:gap-5 lg:px-8">
          {/* Logo e wordmark */}
          <Link
            href="/"
            onClick={(event) => {
              closeMobileMenu();
              setCategoriesOpen(false);
              if (
                event.button === 0 &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                if (pathname === "/") router.refresh();
                else router.push("/");
              }
            }}
            aria-label={`${dictionary.brand.name} — ${brandTagline}`}
            className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
          >
            <ManosProLogo variant="light-on-dark" size="sm" />
            <span className="flex flex-col justify-center">
              <span className="whitespace-nowrap text-lg font-extrabold leading-none tracking-tight sm:text-xl">
                <span className="text-white">Manos</span>
                <span className="text-[#F28C28]">Pro</span>
              </span>
              <span className="mt-0.5 hidden text-[11px] font-medium leading-tight text-[#B9B3A9] sm:block">
                {brandTagline}
              </span>
            </span>
          </Link>

          {/* Barra de busca global — Desktop (lg+) */}
          <form
            role="search"
            aria-label={
              isPortuguese
                ? "Buscar profissionais e serviços"
                : "Buscar profesionales y servicios"
            }
            onSubmit={handleGlobalSearch}
            className="hidden max-w-2xl flex-1 items-center overflow-hidden rounded-xl border border-white/15 bg-white text-[#24272B] shadow-sm transition focus-within:border-[#F28C28] focus-within:ring-2 focus-within:ring-[#F28C28]/40 lg:flex"
          >
            <label htmlFor="header-search-desktop" className="sr-only">
              {dictionary.hero.searchProfessionLabel}
            </label>
            <div className="relative flex flex-1 items-center">
              <Search
                className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#666C75]"
                aria-hidden="true"
              />
              <input
                id="header-search-desktop"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isPortuguese
                    ? "Busque eletricista, encanador, pintor, nome..."
                    : "Buscá gasista, plomero, electricista, nombre..."
                }
                className="h-11 w-full bg-transparent px-3 text-sm text-[#24272B] placeholder:text-[#6E747D] focus:outline-none"
              />
            </div>

            <div className="h-6 w-px shrink-0 bg-[#E4DDD2]" aria-hidden="true" />

            <label htmlFor="header-city-desktop" className="sr-only">
              {dictionary.hero.searchZoneLabel}
            </label>
            <div className="relative flex w-44 shrink-0 items-center">
              <MapPin
                className="pointer-events-none ml-2.5 h-3.5 w-3.5 shrink-0 text-[#A65206]"
                aria-hidden="true"
              />
              <select
                id="header-city-desktop"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="h-11 w-full cursor-pointer bg-transparent pr-2 pl-1.5 text-xs font-semibold text-[#24272B] focus:outline-none"
              >
                <option value="all">
                  {isPortuguese ? "Todas as cidades" : "Todas las zonas"}
                </option>
                {regionalCities.map((zone) => (
                  <option key={zone.id} value={zone.city}>
                    {zone.city}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              aria-label={isPortuguese ? "Buscar profissionais" : "Buscar profesionales"}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-[#F28C28] px-4 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B1E22]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xl:inline">
                {isPortuguese ? "Buscar" : "Buscar"}
              </span>
            </button>
          </form>

          {/* Ações à direita — Desktop (lg+) */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <NotificationsBell />
            {accountPending ? (
              <span
                aria-hidden="true"
                className="h-10 w-28 animate-pulse rounded-xl bg-white/10"
              />
            ) : user ? (
              <AccountMenu
                user={user}
                dashboardHref={accountHref}
                isAdmin={isAdmin}
                avatarUrl={avatarUrl}
                profileName={profileName}
                onSignOut={signOut}
              />
            ) : (
              <Link
                href="/entrar"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 text-sm font-semibold text-white transition-colors hover:border-white/45 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
              >
                <UserCircle2 className="h-4 w-4 text-[#D6D0C5]" aria-hidden="true" />
                <span>{dictionary.nav.login}</span>
              </Link>
            )}
            <Link
              href="/cadastro?role=professional"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#F28C28] px-3.5 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#24272B]"
            >
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">{dictionary.nav.registerAsPro}</span>
            </Link>
          </div>

          {/* Ações rápidas — Mobile (< lg) */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <NotificationsBell />
            {!accountPending && (
              <Link
                href={user ? (accountHref ?? "/conta") : "/entrar"}
                aria-label={
                  user
                    ? isPortuguese
                      ? "Minha conta"
                      : "Mi cuenta"
                    : dictionary.nav.login
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
              >
                <UserCircle2 className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}
            <button
              ref={mobileToggleRef}
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileDrawerId}
              aria-label={
                mobileMenuOpen
                  ? isPortuguese
                    ? "Fechar menu"
                    : "Cerrar menú"
                  : isPortuguese
                    ? "Abrir menu"
                    : "Abrir menú"
              }
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Busca sempre acessível no Mobile (< lg) */}
        <div className="px-4 pb-2.5 sm:px-6 lg:hidden">
          <form
            role="search"
            aria-label={
              isPortuguese
                ? "Buscar profissionais e serviços"
                : "Buscar profesionales y servicios"
            }
            onSubmit={handleGlobalSearch}
            className="flex items-center overflow-hidden rounded-xl border border-white/15 bg-white text-[#24272B] shadow-xs focus-within:border-[#F28C28] focus-within:ring-2 focus-within:ring-[#F28C28]/40"
          >
            <label htmlFor="header-search-mobile" className="sr-only">
              {dictionary.hero.searchProfessionLabel}
            </label>
            <Search
              className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-[#666C75]"
              aria-hidden="true"
            />
            <input
              id="header-search-mobile"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isPortuguese
                  ? "Buscar eletricista, encanador, pintor..."
                  : "Buscar gasista, plomero, pintor..."
              }
              className="h-10 min-w-0 flex-1 bg-transparent px-2.5 text-sm text-[#24272B] placeholder:text-[#6E747D] focus:outline-none"
            />
            <button
              type="submit"
              aria-label={isPortuguese ? "Buscar" : "Buscar"}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center bg-[#F28C28] px-3.5 text-xs font-bold text-[#1B1E22] hover:bg-[#DF7B18]"
            >
              {isPortuguese ? "Buscar" : "Buscar"}
            </button>
          </form>
        </div>
      </div>

      {/* FAIXA 2: SUB-BARRA MARKETPLACE — REGIÃO + CATEGORIAS + NAVEGAÇÃO (Desktop lg+) */}
      <div className="hidden border-b border-[#2E333A] bg-[#1B1E22] lg:block">
        <div className="mx-auto flex h-11 max-w-[1440px] items-center justify-between gap-4 px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Seletor regional estilo marketplace */}
            <div
              role="group"
              aria-label={dictionary.nav.regionSelectorLabel}
              className="inline-flex items-center gap-1 rounded-lg border border-[#32373E] bg-[#24272B] p-0.5"
            >
              <MapPin
                className="ml-2 mr-1 h-3.5 w-3.5 text-[#F28C28]"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => handleRegionChange("AR")}
                aria-pressed={country === "AR"}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]",
                  country === "AR"
                    ? "bg-[#F7F4EE] text-[#1B1E22]"
                    : "text-[#C4BEB4] hover:bg-white/10 hover:text-white"
                )}
              >
                AR · ARS
              </button>
              <button
                type="button"
                onClick={() => handleRegionChange("BR")}
                aria-pressed={country === "BR"}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]",
                  country === "BR"
                    ? "bg-[#F7F4EE] text-[#1B1E22]"
                    : "text-[#C4BEB4] hover:bg-white/10 hover:text-white"
                )}
              >
                BR · BRL
              </button>
            </div>

            <div className="h-4 w-px bg-[#32373E]" aria-hidden="true" />

            <nav
              aria-label={
                isPortuguese ? "Navegação principal" : "Navegación principal"
              }
              className="flex items-center gap-1"
            >
              {/* Dropdown acessível de Categorias */}
              <div ref={categoriesMenuRef} className="relative">
                <button
                  ref={categoriesButtonRef}
                  type="button"
                  aria-expanded={categoriesOpen}
                  aria-haspopup="true"
                  aria-controls={categoriesMenuId}
                  onClick={() => setCategoriesOpen((open) => !open)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]",
                    isCategoriesActive || categoriesOpen
                      ? "bg-white/12 text-white"
                      : "text-[#D4CFC6] hover:bg-white/8 hover:text-white"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-[#F28C28]" aria-hidden="true" />
                  <span>{dictionary.nav.categories}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-150",
                      categoriesOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {categoriesOpen && (
                  <div
                    id={categoriesMenuId}
                    className="absolute top-full left-0 z-50 mt-2 w-[540px] rounded-2xl border border-[#DFD8CC] bg-white p-3 text-[#24272B] shadow-2xl"
                  >
                    <div className="grid grid-cols-2 gap-1.5">
                      {SERVICE_CATEGORIES.map((category) => (
                        <Link
                          key={category.id}
                          href={`/categorias/${category.slug}`}
                          onClick={() => setCategoriesOpen(false)}
                          className="group flex items-start gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-[#F7F4EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#24272B] text-[#F28C28] transition-colors group-hover:bg-[#F28C28] group-hover:text-[#1B1E22]">
                            <CategoryIcon name={category.iconName} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-[#24272B] group-hover:text-[#A65206]">
                              {tText(category.name)}
                            </span>
                            <span className="mt-0.5 line-clamp-1 block text-[11px] text-[#565C64]">
                              {category.examples[locale].slice(0, 2).join(", ")}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-[#ECE6DC] pt-2.5 px-1">
                      <Link
                        href="/categorias"
                        onClick={() => setCategoriesOpen(false)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#A65206] hover:bg-[#FEF3E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                      >
                        <span>
                          {isPortuguese
                            ? "Ver todas as categorias"
                            : "Ver todas las categorías"}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                      <Link
                        href="/profissionais"
                        onClick={() => setCategoriesOpen(false)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-[#565C64] hover:text-[#24272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                      >
                        {dictionary.categoriesSection.viewAllProfessionals}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/profissionais"
                aria-current={isDirectoryActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]",
                  isDirectoryActive
                    ? "bg-white/12 text-white"
                    : "text-[#D4CFC6] hover:bg-white/8 hover:text-white"
                )}
              >
                <Compass className="h-3.5 w-3.5 text-[#B9B3A9]" aria-hidden="true" />
                <span>{dictionary.nav.professionals}</span>
              </Link>

              <Link
                href="/#como-funciona"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#D4CFC6] transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
              >
                {dictionary.nav.howItWorks}
              </Link>
            </nav>
          </div>

          {/* Indicador de confiança discreto */}
          <div className="hidden items-center gap-1.5 text-xs font-medium text-[#B9B3A9] xl:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-[#52B788]" aria-hidden="true" />
            <span>
              {isPortuguese
                ? "Perfis públicos verificados · Orçamento sem compromisso"
                : "Perfiles públicos verificados · Presupuesto sin compromiso"}
            </span>
          </div>
        </div>
      </div>

      {/* DRAWER MOBILE ACESSÍVEL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-[#111316]/65 backdrop-blur-xs"
          />
          <div
            ref={drawerRef}
            id={mobileDrawerId}
            role="dialog"
            aria-modal="true"
            aria-label={isPortuguese ? "Menu de navegação" : "Menú de navegación"}
            className="fixed inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-[#24272B] text-[#E6E1D8] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#343940] px-4 py-3.5">
              <div className="flex items-center gap-2">
                <ManosProLogo variant="light-on-dark" size="xs" />
                <span className="text-base font-extrabold text-white">
                  Manos<span className="text-[#F28C28]">Pro</span>
                </span>
              </div>
              <button
                ref={mobileCloseRef}
                type="button"
                onClick={closeMobileMenu}
                aria-label={isPortuguese ? "Fechar menu" : "Cerrar menú"}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-4">
              {/* Região */}
              <div className="rounded-xl border border-[#393E46] bg-[#1B1E22] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#C4BEB4]">
                  <MapPin className="h-3.5 w-3.5 text-[#F28C28]" aria-hidden="true" />
                  <span>
                    {dictionary.nav.regionSelectorLabel} ({currency})
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={dictionary.nav.regionSelectorLabel}>
                  <button
                    type="button"
                    onClick={() => handleRegionChange("AR")}
                    aria-pressed={country === "AR"}
                    className={cn(
                      "min-h-10 cursor-pointer rounded-lg text-xs font-bold transition-colors",
                      country === "AR"
                        ? "bg-[#F7F4EE] text-[#1B1E22]"
                        : "border border-white/15 text-[#D4CFC6] hover:bg-white/10"
                    )}
                  >
                    Argentina · ARS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegionChange("BR")}
                    aria-pressed={country === "BR"}
                    className={cn(
                      "min-h-10 cursor-pointer rounded-lg text-xs font-bold transition-colors",
                      country === "BR"
                        ? "bg-[#F7F4EE] text-[#1B1E22]"
                        : "border border-white/15 text-[#D4CFC6] hover:bg-white/10"
                    )}
                  >
                    Brasil · BRL
                  </button>
                </div>
              </div>

              {/* Links principais */}
              <nav
                aria-label={isPortuguese ? "Menu principal" : "Menú principal"}
                className="space-y-1"
              >
                <Link
                  href="/profissionais"
                  onClick={closeMobileMenu}
                  aria-current={isDirectoryActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-xl px-3.5 text-sm font-semibold transition-colors",
                    isDirectoryActive
                      ? "bg-white/12 text-white"
                      : "text-[#D4CFC6] hover:bg-white/8 hover:text-white"
                  )}
                >
                  <span>{dictionary.nav.professionals}</span>
                  <ChevronRight className="h-4 w-4 text-[#9E988E]" aria-hidden="true" />
                </Link>
                <Link
                  href="/categorias"
                  onClick={closeMobileMenu}
                  aria-current={isCategoriesActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-xl px-3.5 text-sm font-semibold transition-colors",
                    isCategoriesActive
                      ? "bg-white/12 text-white"
                      : "text-[#D4CFC6] hover:bg-white/8 hover:text-white"
                  )}
                >
                  <span>{dictionary.nav.categories}</span>
                  <ChevronRight className="h-4 w-4 text-[#9E988E]" aria-hidden="true" />
                </Link>
                <Link
                  href="/#como-funciona"
                  onClick={closeMobileMenu}
                  className="flex min-h-11 items-center justify-between rounded-xl px-3.5 text-sm font-semibold text-[#D4CFC6] transition-colors hover:bg-white/8 hover:text-white"
                >
                  <span>{dictionary.nav.howItWorks}</span>
                  <ChevronRight className="h-4 w-4 text-[#9E988E]" aria-hidden="true" />
                </Link>
              </nav>

              {/* Atalhos de categorias */}
              <div>
                <p className="mb-2 px-1 text-xs font-bold text-[#B9B3A9]">
                  {isPortuguese ? "Categorias populares" : "Categorías populares"}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SERVICE_CATEGORIES.map((category) => (
                    <Link
                      key={category.id}
                      href={`/categorias/${category.slug}`}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1B1E22] px-2.5 py-2 text-xs font-medium text-[#E6E1D8] hover:border-[#F28C28]/60 hover:text-white"
                    >
                      <CategoryIcon
                        name={category.iconName}
                        className="h-3.5 w-3.5 shrink-0 text-[#F28C28]"
                      />
                      <span className="truncate">{tText(category.name)}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Conta */}
              <div className="border-t border-[#343940] pt-4">
                {accountPending ? (
                  <span
                    aria-hidden="true"
                    className="block h-11 w-full animate-pulse rounded-xl bg-white/10"
                  />
                ) : user ? (
                  <AccountMenu
                    user={user}
                    dashboardHref={accountHref}
                    isAdmin={isAdmin}
                    avatarUrl={avatarUrl}
                    profileName={profileName}
                    isMobile
                    onSignOut={signOut}
                    onNavigate={closeMobileMenu}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/entrar"
                      onClick={closeMobileMenu}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-semibold text-white hover:bg-white/12"
                    >
                      <UserCircle2 className="h-4 w-4" aria-hidden="true" />
                      {dictionary.nav.login}
                    </Link>
                    <Link
                      href="/cadastro"
                      onClick={closeMobileMenu}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/15"
                    >
                      {dictionary.nav.register}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Profissional fixo no rodapé do drawer */}
            <div className="border-t border-[#343940] bg-[#1B1E22] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Link
                href="/cadastro?role=professional"
                onClick={closeMobileMenu}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18]"
              >
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                <span>{dictionary.nav.registerAsPro}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
