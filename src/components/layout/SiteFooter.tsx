"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/features/i18n/LocaleContext";
import { ManosProLogo } from "@/components/ui/ManosProLogo";
import { SERVICE_CATEGORIES } from "@/features/categories/data";

export function SiteFooter() {
  const { dictionary, locale, tText } = useLocale();

  return (
    <footer className="border-t border-[#2E3238] bg-[#24272B] text-[#E6E1D8]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-5">
            <ManosProLogo
              variant="light-on-dark"
              size="md"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#B9B3A9]">
              {dictionary.footer.description}
            </p>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold text-white">
              {dictionary.nav.categories}
            </h2>
            <ul className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#C4BEB4] lg:grid-cols-1">
              {SERVICE_CATEGORIES.slice(0, 6).map((category) => (
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
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-sm font-bold text-white">
              {dictionary.footer.areasTitle}
            </h2>
            <ul className="mt-3.5 space-y-2 text-sm text-[#C4BEB4]">
              <li>
                <Link href="/profissionais" className="hover:text-[#F28C28]">
                  {dictionary.nav.findProfessional}
                </Link>
              </li>
              <li>
                <Link
                  href="/cadastro?role=professional"
                  className="hover:text-[#F28C28]"
                >
                  {dictionary.nav.registerAsPro}
                </Link>
              </li>
              <li>
                <Link href="/entrar" className="hover:text-[#F28C28]">
                  {dictionary.nav.login}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-9 rounded-xl border border-[#393E46] bg-[#1C1F23] p-4 text-xs leading-relaxed text-[#B9B3A9]">
          <h2 className="font-semibold text-[#F28C28]">
            {dictionary.footer.legalTitle}
          </h2>
          <p className="mt-1.5 max-w-4xl">
            {locale === "es-AR"
              ? "Los perfiles y las reseñas corresponden a información publicada por cada usuario. Confirmá el alcance y el precio del trabajo directamente con el profesional antes de contratar."
              : "Os perfis e as avaliações são informações publicadas pelos próprios usuários. Confirme o escopo e o valor do serviço diretamente com o profissional antes de contratar."}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[#343940] pt-5 text-xs text-[#9E988E] sm:flex-row sm:items-center sm:justify-between">
          <p>{dictionary.footer.copyright}</p>
          <p>{locale === "es-AR" ? "Argentina · ARS" : "Brasil · BRL"}</p>
        </div>
      </div>
    </footer>
  );
}
