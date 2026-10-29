"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarClock,
  FileText,
  Globe2,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Send,
  Star,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import {
  fetchRealProfessionalBySlug,
  type RealProfessionalDetail,
} from "@/services/supabase/professionals";
import {
  startOrGetConversation,
  type QuoteStatusType,
} from "@/services/supabase/messaging";
import { formatRegionalCurrency } from "@/features/i18n/regions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "MP";
  if (parts.length === 1) return (parts[0] ?? "MP").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export default function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { dictionary, formatDate, locale } = useLocale();

  const [professional, setProfessional] =
    useState<RealProfessionalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado del formulario real para iniciar o reutilizar conversación / presupuesto
  const [contactMode, setContactMode] = useState<QuoteStatusType | null>(null);
  const [subjectInput, setSubjectInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchRealProfessionalBySlug(slug);
      setProfessional(data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "No se pudo consultar el perfil en Supabase."
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    fetchRealProfessionalBySlug(slug)
      .then((data) => {
        if (!active) return;
        setProfessional(data);
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "No se pudo consultar el perfil en Supabase."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F28C28]" />
        <p className="mt-3 text-sm font-semibold text-[#24272B]">
          {locale === "es-AR"
            ? "Cargando perfil profesional desde Supabase..."
            : "Carregando perfil profissional do Supabase..."}
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
            onClick={() => void loadProfile()}
          >
            {dictionary.directoryPage.retryBtn}
          </Button>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-[#24272B]">
          {locale === "es-AR"
            ? "Perfil profesional no encontrado"
            : "Perfil profissional não encontrado"}
        </h1>
        <p className="mt-2 text-sm text-[#525860]">
          {locale === "es-AR"
            ? "El perfil solicitado no existe o se encuentra en modo borrador."
            : "O perfil solicitado não existe ou está em modo rascunho."}
        </p>
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

  const specialtyText =
    locale === "pt-BR"
      ? professional.primarySpecialtyPtBr || professional.primarySpecialtyEsAr
      : professional.primarySpecialtyEsAr || professional.primarySpecialtyPtBr;

  const hasRegisteredPrice =
    professional.referenceStartingPrice !== null &&
    professional.referenceStartingPrice > 0;

  const hasRealReviews =
    professional.realReviewCount > 0 && professional.realAverageRating !== null;

  const locationLabel = [professional.neighborhood, professional.city]
    .filter((p) => Boolean(p && p.trim().length > 0))
    .join(", ");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Navegación superior */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/profissionais"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#24272B] hover:text-[#C86D14]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{dictionary.profileDetail.backToDirectory}</span>
        </Link>
        <Badge variant="emerald">
          {professional.country === "BR"
            ? "Brasil · Moneda BRL"
            : "Argentina · Moneda ARS"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* COLUMNA PRINCIPAL (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Cabecera del perfil */}
          <section className="overflow-hidden rounded-2xl border border-[#DFD8CC] bg-white shadow-2xs">
            <div className="h-28 w-full bg-[#24272B]" />

            <div className="px-6 pb-6">
              <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  {professional.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={professional.avatarUrl}
                      alt={professional.fullName}
                      className="h-22 w-22 rounded-2xl border-4 border-white object-cover bg-[#EFEAE1] shadow-sm"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-22 w-22 items-center justify-center rounded-2xl border-4 border-white bg-[#24272B] text-xl font-bold text-[#F28C28] shadow-sm"
                    >
                      {getInitials(professional.fullName)}
                    </div>
                  )}
                  <div className="pb-1">
                    <h1 className="text-2xl font-extrabold text-[#24272B]">
                      {professional.fullName}
                    </h1>
                    <p className="text-sm font-semibold text-[#C86D14]">
                      {specialtyText}
                    </p>
                  </div>
                </div>

                {hasRealReviews && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F7F4EE] px-3 py-1.5 text-xs font-bold text-[#24272B] border border-[#E4DDD2]">
                      <Star
                        className="h-4 w-4 fill-[#F28C28] text-[#F28C28]"
                        aria-hidden="true"
                      />
                      {(professional.realAverageRating as number).toFixed(1)} (
                      {professional.realReviewCount})
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-[#525860]">
                {locationLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7F4EE] px-3 py-1.5">
                    <MapPin
                      className="h-3.5 w-3.5 text-[#F28C28]"
                      aria-hidden="true"
                    />
                    {locationLabel} ({professional.country})
                  </span>
                )}
                {professional.yearsOfExperience > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7F4EE] px-3 py-1.5">
                    <Briefcase
                      className="h-3.5 w-3.5 text-[#24272B]"
                      aria-hidden="true"
                    />
                    {professional.yearsOfExperience}{" "}
                    {dictionary.profileCard.experienceYears}
                  </span>
                )}
              </div>

              <div className="mt-5 border-t border-[#ECE6DC] pt-5">
                <h2 className="text-base font-bold text-[#24272B]">
                  {dictionary.profileDetail.aboutTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#42474F]">
                  {professional.bio ||
                    (locale === "es-AR"
                      ? "El profesional aún no agregó una descripción extendida."
                      : "O profissional ainda não adicionou uma descrição detalhada.")}
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

          {/* Catálogo de servicios reales y precios de referencia */}
          <section className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-2xs">
            <h2 className="text-lg font-bold text-[#24272B]">
              {dictionary.profileDetail.servicesTitle}
            </h2>
            <p className="mt-1 text-xs text-[#666C75]">
              {dictionary.profileDetail.servicesNote}
            </p>

            {professional.services.length === 0 ? (
              <p className="mt-4 text-sm text-[#525860]">
                {locale === "es-AR"
                  ? "Este profesional aún no detalló servicios individuales. Podés solicitar un presupuesto a medida."
                  : "Este profissional ainda não listou serviços individuais. Você pode solicitar um orçamento sob medida."}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {professional.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-[#E6DFD3] bg-[#F7F4EE]/60 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-[#24272B]">
                        {srv.title}
                      </h3>
                      {srv.description && (
                        <p className="mt-1 text-xs text-[#525860]">
                          {srv.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 sm:text-right">
                      {srv.referencePriceAmount ? (
                        <>
                          <span className="font-mono text-base font-bold text-[#24272B]">
                            {formatRegionalCurrency(
                              srv.referencePriceAmount,
                              srv.currency,
                              srv.currency === "BRL" ? "pt-BR" : "es-AR"
                            )}
                          </span>
                          <span className="block text-[11px] text-[#666C75]">
                            {srv.priceUnitLabel}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-[#24272B]">
                          {dictionary.profileCard.referenceOnQuote}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Galería de trabajos anteriores reales */}
          {professional.portfolio.length > 0 && (
            <section className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-2xs">
              <h2 className="text-lg font-bold text-[#24272B]">
                {locale === "es-AR"
                  ? "Galería de trabajos anteriores"
                  : "Galeria de trabalhos anteriores"}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {professional.portfolio.map((item) => (
                  <figure
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-[#E6DFD3] bg-[#F7F4EE]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.publicUrl}
                      alt={item.caption}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                    <figcaption className="p-3.5">
                      <p className="text-sm font-bold text-[#24272B]">
                        {item.caption}
                      </p>
                      <p className="mt-0.5 text-xs text-[#666C75]">
                        {item.zoneLabel} · {item.workYear}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Reseñas reales (sin inventar reseñas ficticias) */}
          <section className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-2xs">
            <h2 className="text-lg font-bold text-[#24272B]">
              {locale === "es-AR"
                ? "Calificaciones de clientes"
                : "Avaliações de clientes"}
            </h2>

            {professional.reviews.length === 0 ? (
              <p className="mt-2 text-sm text-[#525860]">
                {locale === "es-AR"
                  ? "Este perfil aún no registra reseñas verificadas en la plataforma."
                  : "Este perfil ainda não possui avaliações registradas na plataforma."}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {professional.reviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="rounded-xl border border-[#E6DFD3] bg-[#F7F4EE]/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#525860]">
                        {rev.serviceProvided}
                      </span>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#24272B]">
                          <Star
                            className="h-3.5 w-3.5 fill-[#F28C28] text-[#F28C28]"
                            aria-hidden="true"
                          />
                          {rev.rating}.0
                        </span>
                        <span className="block text-[11px] text-[#666C75]">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-[#3D4249]">{rev.comment}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* COLUMNA LATERAL DE CONTACTO Y PRESUPUESTO (4 cols) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#24272B]">
              {dictionary.profileDetail.sidebarContactTitle}
            </h2>

            {hasRegisteredPrice && (
              <div className="mt-3 rounded-xl bg-[#F7F4EE] p-3.5 border border-[#E4DDD2]">
                <span className="block text-xs text-[#666C75]">
                  {dictionary.profileCard.referenceFrom}
                </span>
                <p className="mt-0.5 font-mono text-xl font-extrabold text-[#24272B]">
                  {formatRegionalCurrency(
                    professional.referenceStartingPrice as number,
                    professional.currency,
                    professional.currency === "BRL" ? "pt-BR" : "es-AR"
                  )}{" "}
                  <span className="text-xs font-normal text-[#525860]">
                    ({professional.currency})
                  </span>
                </p>
              </div>
            )}

            {/* Botones para iniciar o reutilizar conversación privada o presupuesto */}
            <div className="mt-5 space-y-2.5">
              {professional.acceptsQuoteRequests && (
                <Button
                  variant="primary"
                  className="w-full"
                  leftIcon={<FileText className="h-4 w-4" />}
                  onClick={() => {
                    setContactError(null);
                    setContactMode("quote_requested");
                    if (!subjectInput) {
                      setSubjectInput(
                        locale === "es-AR"
                          ? `Solicitud de presupuesto — ${professional.fullName}`
                          : `Solicitação de orçamento — ${professional.fullName}`
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
                    setContactMode("direct_chat");
                    if (!subjectInput) {
                      setSubjectInput(
                        locale === "es-AR"
                          ? `Consulta directa — ${professional.fullName}`
                          : `Consulta direta — ${professional.fullName}`
                      );
                    }
                  }}
                >
                  {dictionary.profileDetail.actionSendMessage}
                </Button>
              )}
            </div>

            {contactMode && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setContactError(null);
                  if (messageInput.trim().length < 5) {
                    setContactError(
                      locale === "es-AR"
                        ? "Escribí un mensaje de al menos 5 caracteres."
                        : "Escreva uma mensagem com pelo menos 5 caracteres."
                    );
                    return;
                  }
                  setIsStartingChat(true);
                  try {
                    const convId = await startOrGetConversation({
                      targetUserId: professional.userId,
                      subject: subjectInput,
                      quoteStatus: contactMode,
                      initialMessage: messageInput,
                    });
                    router.push(`/cliente?conv=${convId}`);
                  } catch (err) {
                    setContactError(
                      err instanceof Error
                        ? err.message
                        : locale === "es-AR"
                          ? "Debés iniciar sesión para enviar un mensaje."
                          : "Você precisa entrar na sua conta para enviar uma mensagem."
                    );
                  } finally {
                    setIsStartingChat(false);
                  }
                }}
                className="mt-4 space-y-3 rounded-xl border border-[#DFD8CC] bg-[#F7F4EE] p-4 text-xs"
              >
                <p className="font-bold text-[#24272B]">
                  {contactMode === "quote_requested"
                    ? locale === "es-AR"
                      ? "Solicitar presupuesto privado"
                      : "Solicitar orçamento privado"
                    : locale === "es-AR"
                      ? "Enviar mensaje directo"
                      : "Enviar mensagem direta"}
                </p>
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder={
                    locale === "es-AR"
                      ? "Asunto o servicio requerido"
                      : "Assunto ou serviço desejado"
                  }
                  className="h-9 w-full rounded-lg border border-[#D4CCC0] bg-white px-2.5 text-xs text-[#24272B]"
                  required
                />
                <textarea
                  rows={3}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={
                    locale === "es-AR"
                      ? "Describí qué necesitás, tu barrio y disponibilidad..."
                      : "Descreva o que você precisa, seu bairro e disponibilidade..."
                  }
                  className="w-full rounded-lg border border-[#D4CCC0] bg-white p-2.5 text-xs text-[#24272B]"
                  required
                />
                {contactError && (
                  <p className="font-semibold text-[#B93829]">{contactError}</p>
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
                    {locale === "es-AR" ? "Abrir chat" : "Abrir chat"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setContactMode(null)}
                  >
                    {dictionary.profileDetail.closeModal}
                  </Button>
                </div>
              </form>
            )}

            {/* Metadatos operativos registrados */}
            <dl className="mt-6 space-y-4 border-t border-[#ECE6DC] pt-5 text-xs">
              {professional.scheduleSummary && (
                <div>
                  <dt className="flex items-center gap-1.5 font-bold text-[#24272B]">
                    <CalendarClock className="h-4 w-4 text-[#F28C28]" />
                    {dictionary.profileDetail.sidebarAvailabilityLabel}
                  </dt>
                  <dd className="mt-1 text-[#525860]">
                    {professional.scheduleSummary}
                  </dd>
                </div>
              )}

              {professional.coverageZones.length > 0 && (
                <div>
                  <dt className="flex items-center gap-1.5 font-bold text-[#24272B]">
                    <MapPin className="h-4 w-4 text-[#F28C28]" />
                    {dictionary.profileDetail.sidebarZonesLabel}
                  </dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {professional.coverageZones.map((zone) => (
                      <span
                        key={zone}
                        className="rounded-md bg-[#F7F4EE] px-2 py-0.5 text-[#3D4249] border border-[#E4DDD2]"
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
                    <Globe2 className="h-4 w-4 text-[#F28C28]" />
                    {dictionary.profileDetail.sidebarLanguagesLabel}
                  </dt>
                  <dd className="mt-1 text-[#525860]">
                    {professional.languages.join(" · ")}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
