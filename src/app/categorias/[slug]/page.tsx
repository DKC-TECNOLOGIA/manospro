"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import {
  fetchRealCategories,
  fetchRealCategoryBySlug,
  searchRealProfessionals,
  type PaginatedProfessionalsResult,
} from "@/services/supabase/professionals";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { CategorySlug, ServiceCategory } from "@/types/domain";

const CATEGORY_PAGE_SIZE = 6;

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { dictionary, locale, tText } = useLocale();

  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [result, setResult] = useState<PaginatedProfessionalsResult>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: CATEGORY_PAGE_SIZE,
    totalPages: 1,
    hasAnyReviewsInResult: false,
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCategoryAndProfessionals = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [cats, currentCat] = await Promise.all([
        fetchRealCategories(),
        fetchRealCategoryBySlug(slug),
      ]);
      setAllCategories(cats);
      setCategory(currentCat);

      if (currentCat) {
        const prosResult = await searchRealProfessionals({
          categorySlug: currentCat.slug as CategorySlug,
          page,
          pageSize: CATEGORY_PAGE_SIZE,
        });
        setResult(prosResult);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la categoría desde Supabase."
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug, page]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchRealCategories(), fetchRealCategoryBySlug(slug)])
      .then(async ([cats, currentCat]) => {
        if (!active) return;
        setAllCategories(cats);
        setCategory(currentCat);
        if (currentCat) {
          const prosResult = await searchRealProfessionals({
            categorySlug: currentCat.slug as CategorySlug,
            page,
            pageSize: CATEGORY_PAGE_SIZE,
          });
          if (active) setResult(prosResult);
        }
        if (active) setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la categoría desde Supabase."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, page]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F28C28]" />
        <p className="mt-3 text-sm font-semibold text-[#24272B]">
          {locale === "es-AR"
            ? "Cargando categoría desde Supabase..."
            : "Carregando categoria do Supabase..."}
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-9 w-9 text-[#B93829]" />
        <h1 className="mt-3 text-xl font-bold text-[#24272B]">
          {errorMessage}
        </h1>
        <div className="mt-5">
          <Button
            variant="graphite"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void loadCategoryAndProfessionals()}
          >
            {dictionary.directoryPage.retryBtn}
          </Button>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-[#24272B]">
          {locale === "es-AR"
            ? "Categoría no encontrada"
            : "Categoria não encontrada"}
        </h1>
        <div className="mt-6">
          <Link
            href="/profissionais"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#24272B] px-5 text-sm font-semibold text-[#F7F4EE]"
          >
            <ArrowLeft className="h-4 w-4" />
            {dictionary.profileDetail.backToDirectory}
          </Link>
        </div>
      </div>
    );
  }

  const examples = category.examples[locale];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Navegación rápida entre las categorías reales */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {allCategories.map((cat) => {
          const isCurrent = cat.slug === category.slug;
          return (
            <Link
              key={cat.id}
              href={`/categorias/${cat.slug}`}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
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

      {/* Cabecera de la categoría */}
      <div className="rounded-2xl border border-[#DFD8CC] bg-[#24272B] p-6 text-[#F7F4EE] sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F28C28] text-[#1B1E22]">
                <CategoryIcon name={category.iconName} className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="orange">
                  {result.totalCount}{" "}
                  {locale === "es-AR"
                    ? "perfiles publicados"
                    : "perfis publicados"}
                </Badge>
                <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                  {tText(category.name)}
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm text-[#CFCAC0] sm:text-base">
              {tText(category.shortDescription)}
            </p>
          </div>

          <Link
            href={`/profissionais?category=${category.slug}`}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 text-sm font-bold text-[#1B1E22] hover:bg-[#DF7B18]"
          >
            <span>
              {locale === "es-AR"
                ? "Filtrar en el directorio"
                : "Filtrar no diretório"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Especialidades incluidas desde la tabla categories */}
        {examples.length > 0 && (
          <div className="mt-6 border-t border-[#383D44] pt-4">
            <p className="text-xs font-semibold text-[#B9B3A9]">
              {dictionary.categoriesSection.examplesLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {examples.map((ex) => (
                <span
                  key={ex}
                  className="rounded-lg bg-[#30353C] px-3 py-1 text-xs font-medium text-[#F7F4EE]"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Listado de perfiles reales de esta categoría */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#24272B]">
            {locale === "es-AR"
              ? `Profesionales en ${tText(category.name)}`
              : `Profissionais em ${tText(category.name)}`}
          </h2>
        </div>

        {result.items.length === 0 ? (
          <div className="rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
            <p className="text-base font-bold text-[#24272B]">
              {locale === "es-AR"
                ? "Todavía no hay perfiles publicados en esta categoría"
                : "Ainda não há perfis publicados nesta categoria"}
            </p>
            <p className="mx-auto mt-1.5 max-w-lg text-sm text-[#525860]">
              {locale === "es-AR"
                ? "¿Sos profesional de este rubro? Podés publicar tu perfil desde el área profesional."
                : "Você atua nesta área? Crie e publique seu perfil na área do profissional."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/profissionais"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#24272B] px-5 text-sm font-semibold text-[#F7F4EE]"
              >
                {dictionary.featuredSection.viewFullDirectory}
              </Link>
              <Link
                href="/profissional"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F28C28] px-5 text-sm font-semibold text-[#1B1E22]"
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
                <span className="text-xs font-semibold text-[#525860]">
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
                    {locale === "es-AR" ? "Siguiente" : "Próxima"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
