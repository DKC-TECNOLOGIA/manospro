"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { SERVICE_CATEGORIES } from "@/features/categories/data";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import type { PublicFetchStatus } from "@/services/supabase/publicServer";
import type { ServiceCategory } from "@/types/domain";

interface CategoriesIndexClientProps {
  initialCategories: ServiceCategory[];
  initialStatus: PublicFetchStatus;
}

export function CategoriesIndexClient({
  initialCategories,
  initialStatus,
}: CategoriesIndexClientProps) {
  const { dictionary, locale, tText } = useLocale();
  const isPortuguese = locale === "pt-BR";
  const [filterText, setFilterText] = useState("");

  const categories =
    initialCategories.length > 0 ? initialCategories : SERVICE_CATEGORIES;

  const filteredCategories = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((cat) => {
      const name = tText(cat.name).toLowerCase();
      const desc = tText(cat.shortDescription).toLowerCase();
      const examples = cat.examples[locale].join(" ").toLowerCase();
      return (
        name.includes(query) || desc.includes(query) || examples.includes(query)
      );
    });
  }, [categories, filterText, locale, tText]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Breadcrumb
        items={[
          { label: dictionary.nav.home, href: "/" },
          { label: dictionary.nav.categories },
        ]}
        className="mb-5"
      />

      <div className="rounded-2xl border border-[#DFD8CC] bg-[#24272B] p-6 text-[#F7F4EE] sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {dictionary.categoriesSection.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#CFCAC0] sm:text-base">
              {dictionary.categoriesSection.subtitle}
            </p>
          </div>

          <div className="w-full max-w-sm">
            <label htmlFor="categories-quick-filter" className="sr-only">
              {isPortuguese
                ? "Filtrar categorias ou especialidades"
                : "Filtrar categorías o especialidades"}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#666C75]"
                aria-hidden="true"
              />
              <input
                id="categories-quick-filter"
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={
                  isPortuguese
                    ? "Filtrar categoria ou especialidade..."
                    : "Filtrar categoría o especialidad..."
                }
                className="h-11 w-full rounded-xl border border-white/15 bg-white pr-3.5 pl-10 text-sm text-[#24272B] placeholder:text-[#6E747D] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/40"
              />
            </div>
          </div>
        </div>
      </div>

      {initialStatus === "error" && (
        <p className="mt-4 rounded-xl border border-[#DFD8CC] bg-[#EFEAE1] px-4 py-2.5 text-xs font-medium text-[#565C64]">
          {isPortuguese
            ? "Exibindo o catálogo padrão de categorias enquanto reconectamos ao serviço."
            : "Mostrando el catálogo estándar de categorías mientras reconectamos al servicio."}
        </p>
      )}

      {filteredCategories.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
          <p className="text-base font-bold text-[#24272B]">
            {isPortuguese
              ? "Nenhuma categoria encontrada para esse termo."
              : "No encontramos categorías con ese término."}
          </p>
          <button
            type="button"
            onClick={() => setFilterText("")}
            className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#24272B] px-4 text-xs font-bold text-white hover:bg-[#32363C]"
          >
            {dictionary.directoryPage.clearFilters}
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredCategories.map((category) => {
            const examples = category.examples[locale];
            return (
              <article
                key={category.id}
                className="flex flex-col justify-between rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-2xs transition-colors hover:border-[#C5BBAE]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#24272B] text-[#F28C28]">
                        <CategoryIcon
                          name={category.iconName}
                          className="h-6 w-6"
                        />
                      </span>
                      <div>
                        <h2 className="text-lg font-extrabold text-[#24272B]">
                          <Link
                            href={`/categorias/${category.slug}`}
                            className="hover:text-[#A65206] focus-visible:outline-none focus-visible:underline"
                          >
                            {tText(category.name)}
                          </Link>
                        </h2>
                        <p className="mt-0.5 text-sm text-[#565C64]">
                          {tText(category.shortDescription)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {examples.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#ECE6DC] pt-4">
                      {examples.map((example) => (
                        <Link
                          key={example}
                          href={`/profissionais?category=${category.slug}&q=${encodeURIComponent(example)}`}
                          className="rounded-lg border border-[#E4DDD2] bg-[#F7F4EE] px-2.5 py-1 text-xs font-semibold text-[#24272B] transition-colors hover:border-[#F28C28] hover:bg-[#FEF3E7] hover:text-[#9A4E06]"
                        >
                          {example}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#ECE6DC] pt-4">
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A65206] hover:underline"
                  >
                    <span>{dictionary.categoriesSection.exploreCategory}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/profissionais?category=${category.slug}`}
                    className="text-xs font-semibold text-[#565C64] hover:text-[#24272B]"
                  >
                    {isPortuguese
                      ? "Filtrar no diretório"
                      : "Filtrar en el directorio"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
