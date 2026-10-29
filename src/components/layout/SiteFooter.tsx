"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone } from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { ManosProLogo } from "@/components/ui/ManosProLogo";
import { SERVICE_CATEGORIES } from "@/features/categories/data";

export function SiteFooter() {
  const { country, currency, dictionary, locale, tText } = useLocale();

  return (
    <footer className="border-t border-[#2E3238] bg-[#24272B] text-[#E6E1D8]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Columna 1: Identidad de marca y preparación multi-plataforma */}
          <div className="lg:col-span-4">
            <ManosProLogo
              variant="light-on-dark"
              size="md"
              showSlogan
              sloganText={dictionary.brand.slogan}
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#B9B3A9]">
              {dictionary.footer.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#30343A] px-3 py-1.5 font-mono text-xs text-[#F7F4EE]">
                <Smartphone className="h-3.5 w-3.5 text-[#F28C28]" aria-hidden="true" />
                Web + React Native / Expo Ready
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#30343A] px-3 py-1.5 font-mono text-xs text-[#F7F4EE]">
                {country} · {locale} · {currency}
              </span>
            </div>
          </div>

          {/* Columna 2: Categorías oficiales */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-white">
              {dictionary.nav.categories}
            </h3>
            <ul className="mt-3.5 space-y-2 text-sm text-[#C4BEB4]">
              {SERVICE_CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categorias/${cat.slug}`}
                    className="transition-colors hover:text-[#F28C28]"
                  >
                    {tText(cat.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Áreas de la plataforma */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white">
              {dictionary.footer.areasTitle}
            </h3>
            <ul className="mt-3.5 space-y-2 text-sm text-[#C4BEB4]">
              <li>
                <Link href="/profissionais" className="hover:text-[#F28C28]">
                  {dictionary.nav.professionals}
                </Link>
              </li>
              <li>
                <Link href="/entrar" className="hover:text-[#F28C28]">
                  {dictionary.nav.login}
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="hover:text-[#F28C28]">
                  {dictionary.nav.register}
                </Link>
              </li>
              <li>
                <Link href="/cliente" className="hover:text-[#F28C28]">
                  {dictionary.nav.clientArea}
                </Link>
              </li>
              <li>
                <Link href="/profissional" className="hover:text-[#F28C28]">
                  {dictionary.nav.proArea}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#F28C28]">
                  {dictionary.nav.adminArea}
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Seguridad arquitectónica y transparencia */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-white">
              {dictionary.footer.legalTitle}
            </h3>
            <div className="mt-3.5 rounded-xl border border-[#393E46] bg-[#1C1F23] p-4 text-xs leading-relaxed text-[#B9B3A9]">
              <p className="flex items-center gap-1.5 font-semibold text-[#F28C28]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Supabase RLS + Verificación Real</span>
              </p>
              <p className="mt-1.5">
                {locale === "es-AR"
                  ? "En ManosPro ningún perfil recibe sello de verificación sin validación documental real. Las claves privadas nunca se exponen en el cliente."
                  : "No ManosPro nenhum perfil recebe selo de verificação sem validação documental real. Chaves privadas nunca são expostas no cliente."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#343940] pt-6 text-xs text-[#9E988E] sm:flex-row sm:items-center">
          <p>{dictionary.footer.copyright}</p>
          <p className="font-mono">
            Paleta oficial: Grafite #24272B · Laranja #F28C28 · Creme #F7F4EE
          </p>
        </div>
      </div>
    </footer>
  );
}
