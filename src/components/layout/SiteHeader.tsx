"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, Globe, Menu, Search, UserCircle2, X } from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { useAuth } from "@/features/auth/AuthProvider";
import { AccountMenu } from "@/features/auth/components/AccountMenu";
import { ManosProLogo } from "@/components/ui/ManosProLogo";
import { NotificationsBell } from "@/features/messaging/components/NotificationsBell";
import { cn } from "@/lib/utils";
import type { CountryCode } from "@/types/domain";

export function SiteHeader() {
  const { country, currency, dictionary, locale, setCountry } = useLocale();
  const { user, isLoading, isResolvingAccount, accountHref, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const brandTagline =
    locale === "es-AR"
      ? "Siempre un profesional cerca de vos"
      : "Sempre um profissional perto de você";

  const navItems = [
    { href: "/profissionais", label: dictionary.nav.professionals },
    { href: "/categorias/electricidad-y-gas", label: dictionary.nav.categories },
    { href: "/#como-funciona", label: dictionary.nav.howItWorks },
  ];

  const isNavItemActive = (href: string) =>
    href.includes("#") ? pathname === "/" : pathname.startsWith(href);

  const handleRegionChange = (nextCountry: CountryCode) => {
    setCountry(nextCountry);
  };

  const renderRegionSelector = (compact = false) => (
    <div
      role="group"
      aria-label={dictionary.nav.regionSelectorLabel}
      className={cn(
        "inline-flex items-center rounded-xl border border-[#393E46] bg-[#1C1F23] p-1",
        compact ? "gap-1" : "shadow-2xs"
      )}
    >
      {!compact && (
        <Globe
          className="ml-2 mr-1.5 h-3.5 w-3.5 text-[#C4BEB4]"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        onClick={() => handleRegionChange("AR")}
        aria-pressed={country === "AR"}
        className={cn(
          "cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
          country === "AR"
            ? "bg-[#E6E1D8] text-[#24272B]"
            : "text-[#C4BEB4] hover:bg-white/10 hover:text-white"
        )}
      >
        {compact ? "AR · ARS" : "AR · ES · ARS"}
      </button>
      <button
        type="button"
        onClick={() => handleRegionChange("BR")}
        aria-pressed={country === "BR"}
        className={cn(
          "cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
          country === "BR"
            ? "bg-[#E6E1D8] text-[#24272B]"
            : "text-[#C4BEB4] hover:bg-white/10 hover:text-white"
        )}
      >
        {compact ? "BR · BRL" : "BR · PT · BRL"}
      </button>
    </div>
  );

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const accountPending = isLoading || (user !== null && isResolvingAccount);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2E3238] bg-[#24272B] text-[#E6E1D8] shadow-[0_8px_24px_rgba(10,12,14,0.16)] backdrop-blur-md">
      <div className="mx-auto flex min-h-[4.75rem] max-w-[1440px] items-center justify-between gap-4 px-4 py-1 sm:px-6 lg:px-8 xl:gap-6">
        <Link
          href="/"
          onClick={(event) => {
            closeMobileMenu();
            if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
              event.preventDefault();
              if (pathname === "/") router.refresh();
              else router.push("/");
            }
          }}
          aria-label={`${dictionary.brand.name} — ${brandTagline}`}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] sm:gap-3 xl:flex-none"
        >
          <ManosProLogo variant="light-on-dark" size="md" />
          <span className="flex min-w-0 flex-col justify-center gap-1">
            <span className="whitespace-nowrap text-lg font-bold leading-none tracking-tight sm:text-xl xl:text-2xl">
              <span className="text-white">Manos</span>
              <span className="text-[#F28C28]">Pro</span>
            </span>
            <span className="max-w-[125px] text-[9px] font-normal leading-tight text-[#C4BEB4] sm:max-w-none sm:whitespace-nowrap sm:text-xs">
              {brandTagline}
            </span>
          </span>
        </Link>

        <nav
          aria-label={locale === "es-AR" ? "Navegación principal" : "Navegação principal"}
          className="hidden items-center gap-1 xl:flex"
        >
          {navItems.map((item) => {
            const isActive = isNavItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/12 font-semibold text-white ring-1 ring-white/12"
                    : "text-[#C4BEB4] hover:bg-white/8 hover:text-white"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {renderRegionSelector()}
          <NotificationsBell />
          {accountPending ? (
            <span aria-hidden="true" className="h-10 w-28 animate-pulse rounded-xl bg-white/10" />
          ) : user ? (
            <AccountMenu
              user={user}
              dashboardHref={accountHref}
              isAdmin={isAdmin}
              onSignOut={signOut}
            />
          ) : (
            <Link
              href="/entrar"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              <UserCircle2 className="h-4 w-4 text-[#C4BEB4]" aria-hidden="true" />
              <span>{dictionary.nav.login}</span>
            </Link>
          )}
          <Link
            href="/profissionais"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>{dictionary.nav.findProfessional}</span>
          </Link>
          <Link
            href="/cadastro?role=professional"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#F28C28] px-3.5 text-sm font-semibold text-[#1B1E22] transition-colors hover:bg-[#DF7B18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#24272B]"
          >
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
            <span>{dictionary.nav.registerAsPro}</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={
            mobileMenuOpen
              ? locale === "es-AR" ? "Cerrar menú" : "Fechar menu"
              : locale === "es-AR" ? "Abrir menú" : "Abrir menu"
          }
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/5 text-white transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] xl:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-[#2E3238] bg-[#24272B] px-4 pb-5 pt-4 text-[#E6E1D8] sm:px-6 xl:hidden"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#393E46] bg-white/5 p-2.5">
            <span className="text-xs font-semibold text-[#C4BEB4]">
              {dictionary.nav.regionSelectorLabel} ({currency})
            </span>
            {renderRegionSelector(true)}
          </div>

          <nav className="grid grid-cols-1 gap-1 sm:grid-cols-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  "rounded-xl px-3 py-3 text-sm font-medium text-[#C4BEB4] transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]",
                  isNavItemActive(item.href) &&
                    "bg-white/12 font-semibold text-white"
                )}
                aria-current={isNavItemActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href="/profissionais"
              onClick={closeMobileMenu}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              {dictionary.nav.findProfessional}
            </Link>
            <Link
              href="/cadastro?role=professional"
              onClick={closeMobileMenu}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-semibold text-[#1B1E22] transition-colors hover:bg-[#DF7B18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              {dictionary.nav.registerAsPro}
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#2E3238] pt-3">
            {accountPending ? (
              <span aria-hidden="true" className="h-11 w-32 animate-pulse rounded-xl bg-white/10" />
            ) : user ? (
              <AccountMenu
                user={user}
                dashboardHref={accountHref}
                isAdmin={isAdmin}
                isMobile
                onSignOut={signOut}
                onNavigate={closeMobileMenu}
              />
            ) : (
              <Link
                href="/entrar"
                onClick={closeMobileMenu}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#C4BEB4] transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
              >
                <UserCircle2 className="h-4 w-4" aria-hidden="true" />
                {dictionary.nav.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
