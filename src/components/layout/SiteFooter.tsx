"use client";

import React from "react";
import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { ManosProLogo } from "@/components/ui/ManosProLogo";
import { SERVICE_CATEGORIES } from "@/features/categories/data";

export function SiteFooter() {
  const { country, dictionary, locale, setCountry, tText } = useLocale();
  const isPortuguese = locale === "pt-BR";

  return (
    <footer className="border-t border-[#2E3238] bg-[#1B1E22] text-[#E6E1D8]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Coluna Marca + Região */}
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <ManosProLogo variant="light-on-dark" size="sm" />
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-white">Manos</span>
                <span className="text-[#F28C28]">Pro</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#B9B3A9]">
              {dictionary.footer.description}
            </p>
            <div className="mt-5 inline-flex items-center gap-1 rounded-xl border border-[#343940] bg-[#24272B] p-1">
              <MapPin
                className="ml-2 mr-1 h-3.5 w-3.5 text-[#F28C28]"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setCountry("AR")}
                aria-pressed={country === "AR"}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  country === "AR"
                    ? "bg-[#F7F4EE] text-[#1B1E22]"
                    : "text-[#C4BEB4] hover:text-white"
                }`}
              >
                Argentina · ARS
              </button>
              <button
                type="button"
                onClick={() => setCountry("BR")}
                aria-pressed={country === "BR"}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  country === "BR"
                    ? "bg-[#F7F4EE] text-[#1B1E22]"
                    : "text-[#C4BEB4] hover:text-white"
                }`}
              >
                Brasil · BRL
              </button>
            </div>
          </div>

          {/* Categorias */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold text-white">
              {dictionary.nav.categories}
            </h2>
            <ul className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#C4BEB4] lg:grid-cols-1 xl:grid-cols-2">
              {SERVICE_CATEGORIES.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="transition-colors hover:text-[#F28C28]"
                  >
                    {tText(category.name)}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/categorias"
              className="mt-3.5 inline-block text-xs font-bold text-[#F28C28] hover:underline"
            >
              {isPortuguese
                ? "Explorar índice de categorias"
                : "Explorar índice de categorías"}
            </Link>
          </div>

          {/* Links da plataforma */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-white">
              {dictionary.footer.areasTitle}
            </h2>
            <ul className="mt-3.5 space-y-2.5 text-sm text-[#C4BEB4]">
              <li>
                <Link href="/profissionais" className="transition-colors hover:text-[#F28C28]">
                  {dictionary.nav.findProfessional}
                </Link>
              </li>
              <li>
                <Link
                  href="/cadastro?role=professional"
                  className="transition-colors hover:text-[#F28C28]"
                >
                  {dictionary.nav.registerAsPro}
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="transition-colors hover:text-[#F28C28]">
                  {dictionary.nav.howItWorks}
                </Link>
              </li>
              <li>
                <Link href="/entrar" className="transition-colors hover:text-[#F28C28]">
                  {dictionary.nav.login}
                </Link>
              </li>
            </ul>
          </div>

          {/* Seção Legal e Privacidade */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold text-white">
              {dictionary.footer.legalSectionTitle}
            </h2>
            <nav
              aria-label={dictionary.footer.legalSectionTitle}
              className="mt-3.5"
            >
              <ul className="space-y-2.5 text-sm text-[#C4BEB4]">
                <li>
                  <Link
                    href="/termos-de-uso"
                    className="transition-colors hover:text-[#F28C28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                  >
                    {dictionary.footer.termsLink}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/politica-de-privacidade"
                    className="transition-colors hover:text-[#F28C28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                  >
                    {dictionary.footer.privacyLink}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/politica-de-privacidade#lgpd"
                    className="transition-colors hover:text-[#F28C28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                  >
                    {dictionary.footer.dataProtectionLink}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/politica-de-cookies"
                    className="transition-colors hover:text-[#F28C28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                  >
                    {dictionary.footer.cookiesLink}
                  </Link>
                </li>
              </ul>
            </nav>
            <p className="mt-3.5 text-xs leading-relaxed text-[#9E988E]">
              {isPortuguese
                ? "Conformidade com LGPD (Brasil) e Ley 25.326 (Argentina)."
                : "Cumplimiento con Ley 25.326 (Argentina) y LGPD (Brasil)."}
            </p>
          </div>
        </div>

        {/* Transparência */}
        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-[#32373E] bg-[#24272B] p-4 text-xs leading-relaxed text-[#C4BEB4]">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-[#52B788]"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-bold text-white">{dictionary.footer.legalTitle}</h2>
            <p className="mt-1 max-w-4xl">
              {isPortuguese
                ? "Os perfis públicos passam por verificação prévia de cadastro. As avaliações e preços de referência refletem informações reais publicadas na plataforma; confirme escopo, prazo e valor final diretamente com o profissional."
                : "Los perfiles públicos pasan por verificación previa. Las reseñas y precios de referencia reflejan información real publicada en la plataforma; confirmá el alcance, plazo y valor final directamente con el profesional."}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[#2E333A] pt-5 text-xs text-[#9E988E] sm:flex-row sm:items-center sm:justify-between">
          <p>{dictionary.footer.copyright}</p>
          <p>
            {isPortuguese
              ? "Brasil (BRL) e Argentina (ARS)"
              : "Argentina (ARS) y Brasil (BRL)"}
          </p>
        </div>
      </div>
    </footer>
  );
}
