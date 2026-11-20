"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { SERVICE_CATEGORIES } from "@/features/categories/data";
import {
  searchRealProfessionals,
  type PaginatedProfessionalsResult,
} from "@/services/supabase/professionals";
import type { PublicFetchStatus } from "@/services/supabase/publicServer";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { CategorySlug, CountryCode, ServiceCategory } from "@/types/domain";

const CATEGORY_PAGE_SIZE = 6;

interface CategoryDetailClientProps {
  slug: string;
  initialAllCategories: ServiceCategory[];
  initialCategory: ServiceCategory | null;
  initialCategoryStatus: PublicFetchStatus;
  initialResult: PaginatedProfessionalsResult;
  initialProsStatus: PublicFetchStatus;
}

export function CategoryDetailClient({
  slug,
  initialAllCategories,
  initialCategory,
  initialCategoryStatus,
  initialResult,
  initialProsStatus,
}: CategoryDetailClientProps) {
  const { dictionary, locale, tText } = useLocale();
  const isPortuguese = locale === "pt-BR";

  const allCategories =
    initialAllCategories.length > 0 ? initialAllCategories : SERVICE_CATEGORIES;
  const category = initialCategory;

  const [selectedCountry, setSelectedCountry] = useState<CountryCode | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(1);
  const [result, setResult] =
    useState<PaginatedProfessionalsResult>(initialResult);
  const [prosStatus, setProsStatus] =
    useState<PublicFetchStatus>(initialProsStatus);
  const [isLoading, setIsLoading] = useState(false);

  const hasMountedRef = useRef(false);

  const fetchProfessionals = useCallback(
    async (targetCountry: CountryCode | "ALL", targetPage: number) => {
      if (!category) return;
      setIsLoading(true);
      try {
        const res = await searchRealProfessionals({
          categorySlug: category.slug as CategorySlug,
          country: targetCountry,
          page: targetPage,
          pageSize: CATEGORY_PAGE_SIZE,
        });
        setResult(res);
        setProsStatus("ok");
      } catch {
        setProsStatus("error");
      } finally {
        setIsLoading(false);
      }
    },
    [category]
  );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    void fetchProfessionals(selectedCountry, page);
  }, [selectedCountry, page, fetchProfessionals]);

  if (!category && initialCategoryStatus === "error") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <AlertTriangle
          className="mx-auto h-9 w-9 text-[#A62C1E]"
          aria-hidden="true"
        />
        <h1 className="mt-3 text-xl font-extrabold text-[#24272B]">
          {isPortuguese
            ? "Não foi possível carregar esta categoria agora."
            : "No se pudo cargar esta categoría en este momento."}
        </h1>
        <div className="mt-6">
          <Link
            href="/categorias"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#24272B] px-5 text-sm font-semibold text-[#F7F4EE]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>
              {isPortuguese ? "Ver todas as categorias" : "Ver todas las categorías"}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-[#24272B]">
          {isPortuguese
            ? "Categoria não encontrada"
            : "Categoría no encontrada"}
        </h1>
        <p className="mt-2 text-sm text-[#565C64]">
          {isPortuguese
            ? `A categoria "${slug}" não existe ou foi desativada.`
            : `La categoría "${slug}" no existe o se encuentra inactiva.`}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/categorias"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#24272B] px-5 text-sm font-semibold text-[#F7F4EE]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>
              {isPortuguese ? "Explorar categorias" : "Explorar categorías"}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const examples = category.examples[locale];
  const categoryName = tText(category.name);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Breadcrumb
        items={[
          { label: dictionary.nav.home, href: "/" },
          { label: dictionary.nav.categories, href: "/categorias" },
          { label: categoryName },
        ]}
        className="mb-5"
      />

      {/* Navegação rápida entre categorias */}
      <div className="no-scrollbar mb-6 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {allCategories.map((cat) => {
          const isCurrent = cat.slug === category.slug;
          return (
            <Link
              key={cat.id}
              href={`/categorias/${cat.slug}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                isCurrent
                  ? "bg-[#24272B] text-[#F7F4EE]"
                  : "border border-[#D8D0C2] bg-white text-[#24272B] hover:border-[#F28C28]"
              }`}
            >
              <CategoryIcon name={cat.iconName} className="h-3.5 w-3.5" />
              <span>{tText(cat.name)}</span>
            </Link>
          );
        })}
      </div>

      {/* Cabeçalho da categoria */}
      <section className="rounded-2xl border border-[#DFD8CC] bg-[#24272B] p-6 text-[#F7F4EE] sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F28C28] text-[#1B1E22]">
                <CategoryIcon name={category.iconName} className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="orange" className="tabular-nums">
                  {result.totalCount}{" "}
                  {isPortuguese ? "perfis verificados" : "perfiles verificados"}
                </Badge>
                <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                  {categoryName}
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm text-[#CFCAC0] sm:text-base">
              {tText(category.shortDescription)}
            </p>
          </div>

          <Link
            href={`/profissionais?category=${category.slug}`}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18]"
          >
            <span>
              {isPortuguese
                ? "Filtrar no diretório"
                : "Filtrar en el directorio"}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {examples.length > 0 && (
          <div className="mt-6 border-t border-[#383D44] pt-4">
            <p className="text-xs font-semibold text-[#B9B3A9]">
              {dictionary.categoriesSection.examplesLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {examples.map((ex) => (
                <Link
                  key={ex}
                  href={`/profissionais?category=${category.slug}&q=${encodeURIComponent(ex)}`}
                  className="rounded-lg bg-[#30353C] px-3 py-1 text-xs font-semibold text-[#F7F4EE] transition-colors hover:bg-[#F28C28] hover:text-[#1B1E22]"
                >
                  {ex}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Listagem de profissionais da categoria */}
      <section className="mt-8">
        <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-extrabold text-[#24272B]">
            {isPortuguese
              ? `Profissionais em ${categoryName}`
              : `Profesionales en ${categoryName}`}
          </h2>

          <div
            role="group"
            aria-label={isPortuguese ? "Filtrar por país" : "Filtrar por país"}
            className="inline-flex items-center gap-1 rounded-xl border border-[#D8D0C2] bg-white p-1"
          >
            {(
              [
                { value: "ALL", label: "AR + BR" },
                { value: "AR", label: "Argentina" },
                { value: "BR", label: "Brasil" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selectedCountry === opt.value}
                onClick={() => {
                  setSelectedCountry(opt.value);
                  setPage(1);
                }}
                className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                  selectedCountry === opt.value
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "text-[#565C64] hover:text-[#24272B]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl border border-[#DFD8CC] bg-white"
              />
            ))}
          </div>
        ) : prosStatus === "unconfigured" ? (
          <div className="rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
            <p className="text-sm font-bold text-[#24272B]">
              {isPortuguese
                ? "O catálogo público está temporariamente indisponível."
                : "El catálogo público no está disponible temporalmente."}
            </p>
          </div>
        ) : prosStatus === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-8 text-center"
          >
            <AlertTriangle
              className="mx-auto h-8 w-8 text-[#A62C1E]"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-bold text-[#24272B]">
              {dictionary.directoryPage.errorTitle}
            </p>
            <div className="mt-4">
              <Button
                variant="graphite"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => void fetchProfessionals(selectedCountry, page)}
              >
                {dictionary.directoryPage.retryBtn}
              </Button>
            </div>
          </div>
        ) : result.items.length === 0 ? (
          <div className="rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
            <h3 className="text-base font-extrabold text-[#24272B]">
              {isPortuguese
                ? "Ainda não há perfis verificados publicados nesta categoria"
                : "Todavía no hay perfiles verificados publicados en esta categoría"}
            </h3>
            <p className="mx-auto mt-1.5 max-w-lg text-sm text-[#565C64]">
              {isPortuguese
                ? "Você atua nesta área? Crie e publique seu perfil profissional para receber consultas da sua região."
                : "¿Sos profesional de este rubro? Creá y publicá tu perfil para recibir consultas de tu zona."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {selectedCountry !== "ALL" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCountry("ALL");
                    setPage(1);
                  }}
                >
                  {dictionary.featuredSection.showAllCountries}
                </Button>
              )}
              <Link
                href="/profissionais"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#24272B] px-5 text-sm font-semibold text-[#F7F4EE]"
              >
                {dictionary.featuredSection.viewFullDirectory}
              </Link>
              <Link
                href="/cadastro?role=professional"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F28C28] px-5 text-sm font-bold text-[#1B1E22]"
              >
                {dictionary.proCtaSection.primaryCta}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {result.items.map((pro) => (
                <ProfessionalCard key={pro.userId} professional={pro} />
              ))}
            </div>

            {result.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-[#DFD8CC] bg-white px-5 py-3.5">
                <span className="text-xs font-semibold text-[#565C64] tabular-nums">
                  Página {result.page} de {result.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.page <= 1}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.page >= result.totalPages}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={() =>
                      setPage((p) => Math.min(result.totalPages, p + 1))
                    }
                  >
                    {isPortuguese ? "Próxima" : "Siguiente"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
