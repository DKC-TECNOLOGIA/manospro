"use client";

import React, { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Expand,
  FileText,
  Globe2,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCategoryBySlug } from "@/features/categories/data";
import {
  fetchRealProfessionalBySlug,
  type RealProfessionalDetail,
} from "@/services/supabase/professionals";
import type { PublicFetchOutcome } from "@/services/supabase/publicServer";
import { useInitialProfile } from "@/features/professionals/components/InitialProfileContext";
import {
  isConversationAuthError,
  startOrGetConversation,
  type QuoteStatusType,
} from "@/services/supabase/messaging";
import { formatRegionalCurrency } from "@/features/i18n/regions";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";

const PROFILE_FETCH_TIMEOUT_MS = 12_000;

async function fetchProfessionalWithTimeout(
  slug: string
): Promise<RealProfessionalDetail | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fetchRealProfessionalBySlug(slug),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error("profile_fetch_timeout"));
        }, PROFILE_FETCH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const PortfolioLightbox = dynamic(
  () =>
    import("@/features/professionals/components/PortfolioLightbox").then(
      (mod) => mod.PortfolioLightbox
    ),
  { ssr: false }
);

function ProfileSkeleton({ isPortuguese }: { isPortuguese: boolean }) {
  const label = isPortuguese ? "Carregando perfil..." : "Cargando perfil...";
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#DFD8CC] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#565C64] shadow-2xs">
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-[#F28C28]"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 lg:col-span-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-[#EAE4DA]" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-32 animate-pulse rounded bg-[#EAE4DA]" />
              <div className="h-6 w-56 animate-pulse rounded bg-[#E4DDD2]" />
              <div className="h-3.5 w-40 animate-pulse rounded bg-[#EFEAE1]" />
            </div>
          </div>
          <div className="mt-6 space-y-2.5 border-t border-[#ECE6DC] pt-5">
            <div className="h-3.5 w-full animate-pulse rounded bg-[#EFEAE1]" />
            <div className="h-3.5 w-5/6 animate-pulse rounded bg-[#EFEAE1]" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#EFEAE1]" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 lg:col-span-4">
          <div className="h-5 w-40 animate-pulse rounded bg-[#E4DDD2]" />
          <div className="mt-4 h-16 animate-pulse rounded-xl bg-[#F3EFE8]" />
          <div className="mt-4 h-10 animate-pulse rounded-xl bg-[#EAE4DA]" />
        </div>
      </div>
    </div>
  );
}

function QuoteActionParamSync({
  onRequestQuote,
}: {
  onRequestQuote: () => void;
}) {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const appliedRef = useRef(false);

  useEffect(() => {
    if (action === "quote" && !appliedRef.current) {
      appliedRef.current = true;
      onRequestQuote();
    }
  }, [action, onRequestQuote]);

  return null;
}

function ProfessionalProfileContent({
  slug,
  matchedInitial,
}: {
  slug: string;
  matchedInitial: PublicFetchOutcome<RealProfessionalDetail | null> | null;
}) {
  const router = useRouter();
  const { dictionary, formatDate, locale, tText } = useLocale();
  const { user, isLoading: isAuthLoading } = useAuth();
  const isPortuguese = locale === "pt-BR";

  const hasServerOutcome =
    matchedInitial !== null && matchedInitial.status !== "unconfigured";

  const [professional, setProfessional] =
    useState<RealProfessionalDetail | null>(() =>
      matchedInitial?.status === "ok" ? matchedInitial.data : null
    );
  const [isLoading, setIsLoading] = useState<boolean>(() => !hasServerOutcome);
  const [hasError, setHasError] = useState<boolean>(
    () => matchedInitial?.status === "error"
  );

  const [contactMode, setContactMode] = useState<QuoteStatusType | null>(null);
  const [subjectInput, setSubjectInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactRequiresLogin, setContactRequiresLogin] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const contactCardRef = useRef<HTMLDivElement>(null);

  const activateQuoteFromQuery = useCallback(() => {
    setContactMode((prev) => prev ?? "quote_requested");
  }, []);

  const loadProfile = useCallback(async () => {
    setProfessional(null);
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await fetchProfessionalWithTimeout(slug);
      setProfessional(data);
    } catch (err) {
      console.error("[ManosPro] Failed to load professional profile:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (hasServerOutcome) return;

    let active = true;
    fetchProfessionalWithTimeout(slug)
      .then((data) => {
        if (!active) return;
        setProfessional(data);
        setHasError(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[ManosPro] Failed to load professional profile:", err);
        setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, hasServerOutcome]);

  const openContactForService = (serviceTitle?: string) => {
    if (!professional) return;
    setContactError(null);
    setContactRequiresLogin(false);

    if (user && user.id !== professional.userId) {
      if (professional.acceptsQuoteRequests) {
        setContactMode("quote_requested");
        setSubjectInput(
          serviceTitle
            ? isPortuguese
              ? `Orçamento: ${serviceTitle}`
              : `Presupuesto: ${serviceTitle}`
            : isPortuguese
              ? `Solicitação de orçamento — ${professional.fullName}`
              : `Solicitud de presupuesto — ${professional.fullName}`
        );
      } else if (professional.acceptsDirectContact) {
        setContactMode("direct_chat");
        setSubjectInput(
          serviceTitle
            ? isPortuguese
              ? `Consulta: ${serviceTitle}`
              : `Consulta: ${serviceTitle}`
            : isPortuguese
              ? `Consulta direta — ${professional.fullName}`
              : `Consulta directa — ${professional.fullName}`
        );
      }
    }

    contactCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  if (isLoading) {
    return <ProfileSkeleton isPortuguese={isPortuguese} />;
  }

  if (hasError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div
          role="alert"
          className="rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-10"
        >
          <AlertTriangle
            className="mx-auto h-9 w-9 text-[#A62C1E]"
            aria-hidden="true"
          />
          <h1 className="mt-3 text-xl font-extrabold text-[#24272B]">
            {isPortuguese
              ? "Não foi possível carregar este perfil agora"
              : "No se pudo cargar este perfil en este momento"}
          </h1>
          <p className="mt-1.5 text-sm text-[#565C64]">
            {dictionary.directoryPage.errorDescription}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button
              variant="graphite"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void loadProfile()}
            >
              {dictionary.directoryPage.retryBtn}
            </Button>
            <Link
              href="/profissionais"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#CFC6B8] bg-white px-5 text-sm font-semibold text-[#24272B]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{dictionary.profileDetail.backToDirectory}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-[#DFD8CC] bg-white p-10">
          <h1 className="text-2xl font-extrabold text-[#24272B]">
            {isPortuguese
              ? "Perfil profissional não encontrado"
              : "Perfil profesional no encontrado"}
          </h1>
          <p className="mt-2 text-sm text-[#565C64]">
            {isPortuguese
              ? "O perfil solicitado não existe, ainda não foi verificado ou está em modo rascunho."
              : "El perfil solicitado no existe, aún no está verificado o se encuentra en modo borrador."}
          </p>
          <div className="mt-6">
            <Link
              href="/profissionais"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#24272B] px-5 text-sm font-semibold text-[#F7F4EE]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{dictionary.profileDetail.backToDirectory}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const specialtyText = isPortuguese
    ? professional.primarySpecialtyPtBr || professional.primarySpecialtyEsAr
    : professional.primarySpecialtyEsAr || professional.primarySpecialtyPtBr;

  const hasRegisteredPrice =
    professional.referenceStartingPrice !== null &&
    professional.referenceStartingPrice > 0;

  const formattedStartingPrice = hasRegisteredPrice
    ? formatRegionalCurrency(
        professional.referenceStartingPrice as number,
        professional.currency,
        professional.currency === "BRL" ? "pt-BR" : "es-AR"
      )
    : null;

  const hasRealReviews =
    professional.realReviewCount > 0 && professional.realAverageRating !== null;

  const locationLabel = [professional.neighborhood, professional.city]
    .filter((p) => Boolean(p && p.trim().length > 0))
    .join(", ");

  const category = getCategoryBySlug(professional.categorySlug);
  const isOwnProfile = Boolean(user && user.id === professional.userId);
  const effectiveContactMode: QuoteStatusType | null =
    contactMode === "quote_requested" && !professional.acceptsQuoteRequests
      ? null
      : contactMode === "direct_chat" && !professional.acceptsDirectContact
        ? null
        : contactMode;
  const effectiveSubject =
    subjectInput ||
    (effectiveContactMode === "quote_requested"
      ? isPortuguese
        ? `Solicitação de orçamento — ${professional.fullName}`
        : `Solicitud de presupuesto — ${professional.fullName}`
      : effectiveContactMode === "direct_chat"
        ? isPortuguese
          ? `Consulta direta — ${professional.fullName}`
          : `Consulta directa — ${professional.fullName}`
        : "");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-7 pb-28 sm:px-6 lg:px-8 lg:pt-9 lg:pb-14">
      <Suspense fallback={null}>
        <QuoteActionParamSync onRequestQuote={activateQuoteFromQuery} />
      </Suspense>
      {/* Breadcrumb + Voltar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Breadcrumb
          items={[
            { label: dictionary.nav.home, href: "/" },
            { label: dictionary.nav.professionals, href: "/profissionais" },
            ...(category
              ? [
                  {
                    label: tText(category.name),
                    href: `/categorias/${category.slug}`,
                  },
                ]
              : []),
            { label: professional.fullName },
          ]}
        />

        <Link
          href="/profissionais"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#24272B] hover:text-[#A65206]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{dictionary.profileDetail.backToDirectory}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* COLUNA PRINCIPAL (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Cabeçalho do perfil */}
          <section className="overflow-hidden rounded-2xl border border-[#DFD8CC] bg-white shadow-2xs">
            <div className="relative h-20 w-full bg-[#24272B] sm:h-24">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#F28C28] via-[#F28C28]/60 to-transparent"
              />
            </div>

            <div className="relative z-10 px-5 pb-6 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="-mt-10 shrink-0 sm:-mt-12">
                    <UserAvatar
                      src={professional.avatarUrl}
                      name={professional.fullName}
                      size="xl"
                      shape="rounded"
                      className="rounded-2xl border-4 border-white shadow-md"
                    />
                  </div>
                  <div className="min-w-0 sm:pt-3">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {professional.isVerified && (
                        <Badge variant="emerald">
                          <ShieldCheck
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {isPortuguese
                              ? "Perfil verificado"
                              : "Perfil verificado"}
                          </span>
                        </Badge>
                      )}
                      <Badge variant="cream">
                        {professional.country === "BR"
                          ? "Brasil · BRL"
                          : "Argentina · ARS"}
                      </Badge>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#24272B] sm:text-3xl">
                      {professional.fullName}
                    </h1>
                    <p className="mt-0.5 text-sm font-bold text-[#A65206]">
                      {specialtyText}
                    </p>
                  </div>
                </div>

                {hasRealReviews && (
                  <div className="flex items-center gap-2 sm:pt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4DDD2] bg-[#F7F4EE] px-3.5 py-2 text-xs font-extrabold text-[#24272B] tabular-nums">
                      <Star
                        className="h-4 w-4 fill-[#F28C28] text-[#F28C28]"
                        aria-hidden="true"
                      />
                      {(professional.realAverageRating as number).toFixed(1)}
                      <span className="font-medium text-[#565C64]">
                        ({professional.realReviewCount})
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Faixa de fatos rápidos */}
              <div className="mt-5 flex flex-wrap gap-2.5 text-xs font-semibold text-[#3D4249]">
                {locationLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DFD3] bg-[#F7F4EE] px-3 py-1.5">
                    <MapPin
                      className="h-3.5 w-3.5 text-[#F28C28]"
                      aria-hidden="true"
                    />
                    {locationLabel} ({professional.country})
                  </span>
                )}
                {professional.yearsOfExperience > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DFD3] bg-[#F7F4EE] px-3 py-1.5 tabular-nums">
                    <Briefcase
                      className="h-3.5 w-3.5 text-[#24272B]"
                      aria-hidden="true"
                    />
                    {professional.yearsOfExperience}{" "}
                    {dictionary.profileCard.experienceYears}
                  </span>
                )}
                {category && (
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DFD3] bg-[#F7F4EE] px-3 py-1.5 hover:border-[#F28C28] hover:text-[#A65206]"
                  >
                    {tText(category.name)}
                  </Link>
                )}
              </div>

              {/* Apresentação */}
              <div className="mt-6 border-t border-[#ECE6DC] pt-5">
                <h2 className="text-base font-extrabold text-[#24272B]">
                  {dictionary.profileDetail.aboutTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#3D4249]">
                  {professional.bio ||
                    (isPortuguese
                      ? "O profissional ainda não adicionou uma apresentação detalhada."
                      : "El profesional aún no agregó una presentación detallada.")}
                </p>

                {professional.secondarySpecialties.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {professional.secondarySpecialties.map((spec) => (
                      <Badge key={spec} variant="cream">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Catálogo de serviços com ação contextual */}
          <section className="rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-2xs sm:p-6">
            <h2 className="text-lg font-extrabold text-[#24272B]">
              {dictionary.profileDetail.servicesTitle}
            </h2>
            <p className="mt-1 text-xs text-[#565C64]">
              {dictionary.profileDetail.servicesNote}
            </p>

            {professional.services.length === 0 ? (
              <p className="mt-4 rounded-xl border border-[#ECE6DC] bg-[#FAF8F4] p-4 text-sm text-[#565C64]">
                {isPortuguese
                  ? "Este profissional ainda não listou serviços individuais. Você pode solicitar um orçamento sob medida."
                  : "Este profesional aún no detalló servicios individuales. Podés solicitar un presupuesto a medida."}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {professional.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-[#E6DFD3] bg-[#FAF8F4] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold text-[#24272B]">
                        {srv.title}
                      </h3>
                      {srv.description && (
                        <p className="mt-1 text-xs leading-relaxed text-[#565C64]">
                          {srv.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <div className="sm:text-right">
                        {srv.referencePriceAmount ? (
                          <>
                            <span className="font-mono text-base font-bold text-[#24272B] tabular-nums">
                              {formatRegionalCurrency(
                                srv.referencePriceAmount,
                                srv.currency,
                                srv.currency === "BRL" ? "pt-BR" : "es-AR"
                              )}
                            </span>
                            <span className="block text-[11px] text-[#565C64]">
                              {srv.priceUnitLabel}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-[#565C64]">
                            {dictionary.profileCard.referenceOnQuote}
                          </span>
                        )}
                      </div>

                      {!isOwnProfile &&
                        (professional.acceptsQuoteRequests ||
                          professional.acceptsDirectContact) && (
                          <button
                            type="button"
                            onClick={() => openContactForService(srv.title)}
                            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#DF7B18]/45 bg-[#FEF3E7] px-2.5 text-xs font-bold text-[#9A4E06] transition-colors hover:bg-[#F28C28] hover:text-[#1B1E22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                          >
                            {professional.acceptsQuoteRequests
                              ? isPortuguese
                                ? "Cotar"
                                : "Cotizar"
                              : isPortuguese
                                ? "Consultar"
                                : "Consultar"}
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Galeria de trabalhos anteriores com Lightbox acessível */}
          {professional.portfolio.length > 0 && (
            <section className="rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-2xs sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-[#24272B]">
                  {dictionary.profileDetail.portfolioTitle}
                </h2>
                <span className="font-mono text-xs font-semibold text-[#565C64] tabular-nums">
                  {professional.portfolio.length}{" "}
                  {professional.portfolio.length === 1 ? "foto" : "fotos"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {professional.portfolio.map((item, idx) => (
                  <figure
                    key={item.id}
                    className="group overflow-hidden rounded-xl border border-[#E6DFD3] bg-[#FAF8F4]"
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      aria-label={
                        isPortuguese
                          ? `Ampliar foto: ${item.caption || "Trabalho realizado"}`
                          : `Ampliar foto: ${item.caption || "Trabajo realizado"}`
                      }
                      className="relative block w-full cursor-pointer overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F28C28]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.publicUrl}
                        alt={item.caption}
                        className="h-48 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <span className="absolute right-2.5 bottom-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B1E22]/75 text-white opacity-90 transition-opacity group-hover:opacity-100">
                        <Expand className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </button>
                    <figcaption className="p-3.5">
                      <p className="text-sm font-bold text-[#24272B]">
                        {item.caption}
                      </p>
                      <p className="mt-0.5 text-xs text-[#565C64]">
                        {item.zoneLabel} · {item.workYear}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Avaliações reais */}
          <section className="rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-2xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-[#24272B]">
                {dictionary.profileDetail.reviewsTitle}
              </h2>
              {hasRealReviews && (
                <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#24272B] tabular-nums">
                  <Star
                    className="h-4 w-4 fill-[#F28C28] text-[#F28C28]"
                    aria-hidden="true"
                  />
                  {(professional.realAverageRating as number).toFixed(1)} ·{" "}
                  {professional.realReviewCount}{" "}
                  {isPortuguese ? "avaliações" : "reseñas"}
                </span>
              )}
            </div>

            {professional.reviews.length === 0 ? (
              <p className="mt-3 rounded-xl border border-[#ECE6DC] bg-[#FAF8F4] p-4 text-sm text-[#565C64]">
                {isPortuguese
                  ? "Este perfil ainda não possui avaliações registradas na plataforma."
                  : "Este perfil aún no registra reseñas verificadas en la plataforma."}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {professional.reviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="rounded-xl border border-[#E6DFD3] bg-[#FAF8F4] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#3D4249]">
                        {rev.serviceProvided}
                      </span>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#24272B] tabular-nums">
                          <Star
                            className="h-3.5 w-3.5 fill-[#F28C28] text-[#F28C28]"
                            aria-hidden="true"
                          />
                          {rev.rating}.0
                        </span>
                        <span className="block text-[11px] text-[#565C64]">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#3D4249]">
                      {rev.comment}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* COLUNA LATERAL DE CONTATO E CONFIANÇA (4 cols) */}
        <aside className="lg:col-span-4">
          <div
            ref={contactCardRef}
            className="sticky top-32 rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-xs sm:p-6"
          >
            <h2 className="text-lg font-extrabold text-[#24272B]">
              {dictionary.profileDetail.sidebarContactTitle}
            </h2>

            {formattedStartingPrice ? (
              <div className="mt-3.5 rounded-xl border border-[#E4DDD2] bg-[#FAF8F4] p-4">
                <span className="block text-xs font-medium text-[#565C64]">
                  {dictionary.profileCard.referenceFrom}
                </span>
                <p className="mt-0.5 font-mono text-2xl font-extrabold text-[#24272B] tabular-nums">
                  {formattedStartingPrice}{" "}
                  <span className="font-sans text-xs font-semibold text-[#565C64]">
                    ({professional.currency})
                  </span>
                </p>
              </div>
            ) : (
              <div className="mt-3.5 rounded-xl border border-[#E4DDD2] bg-[#FAF8F4] p-3.5">
                <p className="text-xs font-bold text-[#24272B]">
                  {dictionary.profileCard.referenceOnQuote}
                </p>
                <p className="mt-0.5 text-xs text-[#565C64]">
                  {isPortuguese
                    ? "Envie os detalhes do trabalho para receber uma estimativa."
                    : "Enviá los detalles del trabajo para recibir una estimación."}
                </p>
              </div>
            )}

            {/* Botões de contato ou login */}
            {isAuthLoading ? (
              <div
                className="mt-5 space-y-2.5"
                aria-busy="true"
                aria-label={
                  isPortuguese ? "Verificando sessão..." : "Verificando sesión..."
                }
              >
                <div className="h-11 w-full animate-pulse rounded-xl bg-[#EFEAE1]" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-[#EFEAE1]" />
              </div>
            ) : isOwnProfile ? (
              <p className="mt-5 rounded-xl border border-[#DFD8CC] bg-[#F7F4EE] p-3.5 text-xs font-semibold text-[#565C64]">
                {isPortuguese
                  ? "Este é o seu perfil público. Os clientes verão aqui os botões para entrar em contato com você."
                  : "Este es tu perfil público. Los clientes verán aquí los botones para contactarte."}
              </p>
            ) : !professional.acceptsQuoteRequests &&
              !professional.acceptsDirectContact ? (
              <p className="mt-5 rounded-xl border border-[#DFD8CC] bg-[#FAF8F4] p-3.5 text-xs font-medium text-[#565C64]">
                {isPortuguese
                  ? "Este profissional pausou temporariamente novos pedidos de contato e orçamento pela plataforma."
                  : "Este profesional pausó temporalmente nuevas consultas y pedidos de presupuesto en la plataforma."}
              </p>
            ) : !user ? (
              <div className="mt-5 space-y-3 rounded-xl border border-[#DFD8CC] bg-[#FAF8F4] p-4 text-xs">
                {contactError && contactRequiresLogin ? (
                  <p role="alert" className="font-semibold text-[#A62C1E]">
                    {contactError}
                  </p>
                ) : (
                  <p className="font-semibold text-[#24272B]">
                    {isPortuguese
                      ? "Entre na sua conta para conversar no chat privado ou solicitar orçamento."
                      : "Iniciá sesión para conversar por chat privado o solicitar un presupuesto."}
                  </p>
                )}
                <Link
                  href={`/entrar?next=${encodeURIComponent(`/profissionais/${professional.slug}`)}`}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#F28C28] px-4 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18]"
                >
                  {contactRequiresLogin
                    ? isPortuguese
                      ? "Entrar novamente"
                      : "Iniciar sesión nuevamente"
                    : isPortuguese
                      ? "Entrar para entrar em contato"
                      : "Iniciar sesión para contactar"}
                </Link>
                <Link
                  href="/cadastro"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#CFC6B8] bg-white px-4 text-xs font-bold text-[#24272B] hover:border-[#24272B]"
                >
                  {dictionary.auth.goToRegister}
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-2.5">
                {professional.acceptsQuoteRequests && (
                  <Button
                    variant="primary"
                    className="w-full"
                    leftIcon={<FileText className="h-4 w-4" />}
                    onClick={() => {
                      setContactError(null);
                      setContactRequiresLogin(false);
                      setContactMode("quote_requested");
                      if (!subjectInput) {
                        setSubjectInput(
                          isPortuguese
                            ? `Solicitação de orçamento — ${professional.fullName}`
                            : `Solicitud de presupuesto — ${professional.fullName}`
                        );
                      }
                    }}
                  >
                    {dictionary.profileDetail.actionRequestQuote}
                  </Button>
                )}

                {professional.acceptsDirectContact && (
                  <Button
                    variant="graphite"
                    className="w-full"
                    leftIcon={<MessageSquare className="h-4 w-4" />}
                    onClick={() => {
                      setContactError(null);
                      setContactRequiresLogin(false);
                      setContactMode("direct_chat");
                      if (!subjectInput) {
                        setSubjectInput(
                          isPortuguese
                            ? `Consulta direta — ${professional.fullName}`
                            : `Consulta directa — ${professional.fullName}`
                        );
                      }
                    }}
                  >
                    {dictionary.profileDetail.actionSendMessage}
                  </Button>
                )}
              </div>
            )}

            {effectiveContactMode && !isAuthLoading && user && !isOwnProfile && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setContactError(null);
                  setContactRequiresLogin(false);
                  if (messageInput.trim().length < 5) {
                    setContactError(
                      isPortuguese
                        ? "Escreva uma mensagem com pelo menos 5 caracteres."
                        : "Escribí un mensaje de al menos 5 caracteres."
                    );
                    return;
                  }
                  setIsStartingChat(true);
                  try {
                    const convId = await startOrGetConversation({
                      targetUserId: professional.userId,
                      subject: effectiveSubject,
                      quoteStatus: effectiveContactMode,
                      initialMessage: messageInput,
                      locale,
                    });
                    router.push(`/cliente?conv=${convId}`);
                  } catch (err) {
                    setContactRequiresLogin(isConversationAuthError(err));
                    setContactError(
                      err instanceof Error
                        ? err.message
                        : isPortuguese
                          ? "Você precisa entrar na sua conta para enviar uma mensagem."
                          : "Debés iniciar sesión para enviar un mensaje."
                    );
                  } finally {
                    setIsStartingChat(false);
                  }
                }}
                className="mt-4 space-y-3 rounded-xl border border-[#DFD8CC] bg-[#F7F4EE] p-4 text-xs"
              >
                <p className="font-extrabold text-[#24272B]">
                  {effectiveContactMode === "quote_requested"
                    ? isPortuguese
                      ? "Solicitar orçamento privado"
                      : "Solicitar presupuesto privado"
                    : isPortuguese
                      ? "Enviar mensagem direta"
                      : "Enviar mensaje directo"}
                </p>
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-1 block text-[11px] font-bold text-[#24272B]"
                  >
                    {isPortuguese
                      ? "Assunto ou serviço"
                      : "Asunto o servicio"}
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={effectiveSubject}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder={
                      isPortuguese
                        ? "Assunto ou serviço desejado"
                        : "Asunto o servicio requerido"
                    }
                    className="h-9 w-full rounded-lg border border-[#CFC6B8] bg-white px-2.5 text-xs text-[#24272B] focus:border-[#F28C28] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1 block text-[11px] font-bold text-[#24272B]"
                  >
                    {isPortuguese ? "Detalhes do pedido" : "Detalles del trabajo"}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={3}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      isPortuguese
                        ? "Descreva o que você precisa, seu bairro e disponibilidade..."
                        : "Describí qué necesitás, tu barrio y disponibilidad..."
                    }
                    className="w-full rounded-lg border border-[#CFC6B8] bg-white p-2.5 text-xs text-[#24272B] focus:border-[#F28C28] focus:outline-none"
                    required
                  />
                </div>
                {contactError && (
                  <div className="space-y-2" role="alert">
                    <p className="font-semibold text-[#A62C1E]">{contactError}</p>
                    {contactRequiresLogin && (
                      <Link
                        href={`/entrar?next=${encodeURIComponent(`/profissionais/${professional.slug}`)}`}
                        className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#F28C28] px-3 text-xs font-bold text-[#1B1E22] hover:bg-[#DF7B18]"
                      >
                        {isPortuguese
                          ? "Entrar novamente"
                          : "Iniciar sesión nuevamente"}
                      </Link>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    isLoading={isStartingChat}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    {isPortuguese ? "Abrir chat" : "Abrir chat"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setContactMode(null)}
                  >
                    {isPortuguese ? "Cancelar" : "Cancelar"}
                  </Button>
                </div>
              </form>
            )}

            {/* Garantias e metadados operacionais */}
            <dl className="mt-6 space-y-4 border-t border-[#ECE6DC] pt-5 text-xs">
              {professional.scheduleSummary && (
                <div>
                  <dt className="flex items-center gap-1.5 font-bold text-[#24272B]">
                    <CalendarClock
                      className="h-4 w-4 text-[#A65206]"
                      aria-hidden="true"
                    />
                    {dictionary.profileDetail.sidebarAvailabilityLabel}
                  </dt>
                  <dd className="mt-1 text-[#565C64]">
                    {professional.scheduleSummary}
                  </dd>
                </div>
              )}

              {professional.coverageZones.length > 0 && (
                <div>
                  <dt className="flex items-center gap-1.5 font-bold text-[#24272B]">
                    <MapPin
                      className="h-4 w-4 text-[#A65206]"
                      aria-hidden="true"
                    />
                    {dictionary.profileDetail.sidebarZonesLabel}
                  </dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {professional.coverageZones.map((zone) => (
                      <span
                        key={zone}
                        className="rounded-md border border-[#E4DDD2] bg-[#F7F4EE] px-2 py-0.5 text-[#3D4249]"
                      >
                        {zone}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              {professional.languages.length > 0 && (
                <div>
                  <dt className="flex items-center gap-1.5 font-bold text-[#24272B]">
                    <Globe2
                      className="h-4 w-4 text-[#A65206]"
                      aria-hidden="true"
                    />
                    {dictionary.profileDetail.sidebarLanguagesLabel}
                  </dt>
                  <dd className="mt-1 text-[#565C64]">
                    {professional.languages.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>

      {/* Barra fixa inferior no Mobile para conversão rápida */}
      {!isOwnProfile &&
        (professional.acceptsQuoteRequests ||
          professional.acceptsDirectContact) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#DFD8CC] bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(27,30,34,0.1)] backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] font-medium text-[#565C64]">
                {formattedStartingPrice
                  ? dictionary.profileCard.referenceFrom
                  : professional.fullName}
              </span>
              <p className="truncate font-mono text-sm font-extrabold text-[#24272B] tabular-nums">
                {formattedStartingPrice ??
                  dictionary.profileCard.referenceOnQuote}
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="shrink-0"
              onClick={() => openContactForService()}
            >
              {professional.acceptsQuoteRequests
                ? dictionary.profileCard.requestQuoteCta
                : dictionary.profileDetail.actionSendMessage}
            </Button>
          </div>
        </div>
      )}

      {/* Lightbox dinâmico da galeria */}
      {lightboxIndex !== null && professional.portfolio.length > 0 && (
        <PortfolioLightbox
          photos={professional.portfolio}
          activeIndex={lightboxIndex}
          locale={locale}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={(next) => setLightboxIndex(next)}
        />
      )}
    </div>
  );
}

export default function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const initialProfile = useInitialProfile();
  const matchedInitial =
    initialProfile && initialProfile.slug === slug
      ? initialProfile.outcome
      : null;
  const contentKey = `${slug}:${matchedInitial ? matchedInitial.status : "client"}:${matchedInitial?.data?.userId ?? "none"}`;

  return (
    <ProfessionalProfileContent
      key={contentKey}
      slug={slug}
      matchedInitial={matchedInitial}
    />
  );
}
