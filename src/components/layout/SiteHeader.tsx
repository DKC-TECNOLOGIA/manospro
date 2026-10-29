"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  UserCircle2,
  X,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { ManosProLogo } from "@/components/ui/ManosProLogo";
import { NotificationsBell } from "@/features/messaging/components/NotificationsBell";
import { cn } from "@/lib/utils";
import type { CountryCode } from "@/types/domain";

export function SiteHeader() {
  const { country, currency, dictionary, setCountry } = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: dictionary.nav.home },
    { href: "/profissionais", label: dictionary.nav.professionals },
    {
      href: "/categorias/electricidad-y-gas",
      label: dictionary.nav.categories,
    },
    { href: "/#como-funciona", label: dictionary.nav.howItWorks },
  ];

  const areaPreviewLinks = [
    { href: "/cliente", label: dictionary.nav.clientArea },
    { href: "/profissional", label: dictionary.nav.proArea },
    { href: "/admin", label: dictionary.nav.adminArea },
  ];

  const handleRegionChange = (nextCountry: CountryCode) => {
    setCountry(nextCountry);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DED7CA] bg-[#F7F4EE]/95 backdrop-blur-md">
      {/* Barra superior informativa de Fase 1 (Modo Demostración) */}
      <div className="bg-[#24272B] px-4 py-2 text-[#F7F4EE]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
          <p className="flex items-center gap-2 font-medium text-[#E9E4DC]">
            <ShieldAlert
              className="h-3.5 w-3.5 shrink-0 text-[#F28C28]"
              aria-hidden="true"
            />
            <span>{dictionary.brand.demoGlobalNotice}</span>
          </p>
          <div className="hidden items-center gap-3 lg:flex">
            {areaPreviewLinks.map((area) => (
              <Link
                key={area.href}
                href={area.href}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                  pathname === area.href
                    ? "bg-[#F28C28] text-[#1B1E22]"
                    : "text-[#D4CFC6] hover:bg-white/10 hover:text-white"
                )}
              >
                <LayoutDashboard className="h-3 w-3" aria-hidden="true" />
                {area.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded-xl"
        >
          <ManosProLogo
            variant="dark-on-light"
            size="md"
            showSlogan
            sloganText={dictionary.brand.slogan}
          />
        </Link>

        {/* Enlaces Desktop */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 md:flex"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.split("#")[0] || item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#EFEAE1] text-[#24272B] font-semibold"
                    : "text-[#42474F] hover:bg-[#EFEAE1]/70 hover:text-[#24272B]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Selector Regional (AR/ARS vs BR/BRL) + Acceso a cuenta */}
        <div className="hidden items-center gap-3 md:flex">
          <div
            role="group"
            aria-label={dictionary.nav.regionSelectorLabel}
            className="inline-flex items-center rounded-xl border border-[#D8D0C2] bg-white p-1 shadow-2xs"
          >
            <Globe
              className="ml-2 mr-1.5 h-3.5 w-3.5 text-[#5A6068]"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => handleRegionChange("AR")}
              aria-pressed={country === "AR"}
              className={cn(
                "cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                country === "AR"
                  ? "bg-[#24272B] text-[#F7F4EE]"
                  : "text-[#4A5058] hover:bg-[#F7F4EE]"
              )}
            >
              AR · ES · ARS
            </button>
            <button
              type="button"
              onClick={() => handleRegionChange("BR")}
              aria-pressed={country === "BR"}
              className={cn(
                "cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                country === "BR"
                  ? "bg-[#24272B] text-[#F7F4EE]"
                  : "text-[#4A5058] hover:bg-[#F7F4EE]"
              )}
            >
              BR · PT · BRL
            </button>
          </div>

          <NotificationsBell />

          <Link
            href="/entrar"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#D5CEC2] bg-white px-3.5 text-sm font-medium text-[#24272B] transition-colors hover:border-[#24272B] hover:bg-[#F7F4EE]"
          >
            <UserCircle2 className="h-4 w-4 text-[#5A6068]" aria-hidden="true" />
            <span>{dictionary.nav.login}</span>
          </Link>

          <Link
            href="/cadastro"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F28C28] px-4 text-sm font-semibold text-[#1B1E22] shadow-xs transition-colors hover:bg-[#DF7B18]"
          >
            {dictionary.nav.registerAsPro}
          </Link>
        </div>

        {/* Botón Menú Móvil */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú de navegación"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8D0C2] bg-white text-[#24272B] md:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Panel Móvil Responsivo */}
      {mobileMenuOpen && (
        <div className="border-t border-[#DED7CA] bg-[#F7F4EE] px-4 pt-3 pb-6 md:hidden">
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[#D8D0C2] bg-white p-2.5">
            <span className="text-xs font-semibold text-[#4A5058]">
              {dictionary.nav.regionSelectorLabel} ({currency})
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleRegionChange("AR")}
                aria-pressed={country === "AR"}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  country === "AR"
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "bg-[#F7F4EE] text-[#24272B]"
                )}
              >
                AR · ARS
              </button>
              <button
                type="button"
                onClick={() => handleRegionChange("BR")}
                aria-pressed={country === "BR"}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  country === "BR"
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "bg-[#F7F4EE] text-[#24272B]"
                )}
              >
                BR · BRL
              </button>
            </div>
          </div>

          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#24272B] hover:bg-[#EFEAE1]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-[#DED7CA] pt-3">
            <p className="px-3 text-xs font-semibold text-[#666C75]">
              Vistas previas estructurales (Fase 2 Auth)
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {areaPreviewLinks.map((area) => (
                <Link
                  key={area.href}
                  href={area.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-[#D8D0C2] bg-white px-2.5 py-2 text-center text-xs font-medium text-[#24272B]"
                >
                  {area.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link
              href="/entrar"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D5CEC2] bg-white text-sm font-semibold text-[#24272B]"
            >
              {dictionary.nav.login}
            </Link>
            <Link
              href="/cadastro"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#F28C28] text-sm font-semibold text-[#1B1E22]"
            >
              {dictionary.nav.register}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
