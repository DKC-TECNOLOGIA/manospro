"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  MapPin,
  MessageSquare,
  Star,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { Badge } from "@/components/ui/Badge";
import { formatRegionalCurrency } from "@/features/i18n/regions";
import type { RealProfessionalListItem } from "@/services/supabase/professionals";

interface ProfessionalCardProps {
  professional: RealProfessionalListItem;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "MP";
  if (parts.length === 1) return (parts[0] ?? "MP").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const { dictionary, locale } = useLocale();

  const specialtyText =
    locale === "pt-BR"
      ? professional.primarySpecialtyPtBr || professional.primarySpecialtyEsAr
      : professional.primarySpecialtyEsAr || professional.primarySpecialtyPtBr;

  const hasRegisteredPrice =
    professional.referenceStartingPrice !== null &&
    professional.referenceStartingPrice > 0;

  const formattedReferencePrice = hasRegisteredPrice
    ? formatRegionalCurrency(
        professional.referenceStartingPrice as number,
        professional.currency,
        professional.currency === "BRL" ? "pt-BR" : "es-AR"
      )
    : null;

  const hasRealReviews =
    professional.realReviewCount > 0 && professional.realAverageRating !== null;

  const locationLabel = [professional.neighborhood, professional.city]
    .filter((part) => Boolean(part && part.trim().length > 0))
    .join(", ");

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-xs transition-colors duration-150 hover:border-[#24272B]/40">
      <div>
        {/* Encabezado: País/Moneda y Ubicación real */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <Badge variant="cream">
            {professional.country === "BR"
              ? "Brasil · BRL"
              : "Argentina · ARS"}
          </Badge>
          {locationLabel && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#565C64] truncate">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 text-[#F28C28]"
                aria-hidden="true"
              />
              <span className="truncate">{locationLabel}</span>
            </span>
          )}
        </div>

        {/* Identidad del profesional */}
        <div className="flex items-start gap-3.5">
          {professional.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={professional.avatarUrl}
              alt={professional.fullName}
              className="h-15 w-15 shrink-0 rounded-xl object-cover border border-[#E4DDD2] bg-[#EFEAE1]"
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl border border-[#E4DDD2] bg-[#24272B] font-bold text-[#F28C28]"
            >
              {getInitials(professional.fullName)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-[#24272B] group-hover:text-[#C86D14] transition-colors">
              <Link
                href={`/profissionais/${professional.slug}`}
                className="focus-visible:outline-none focus-visible:underline"
              >
                {professional.fullName}
              </Link>
            </h3>
            <p className="mt-0.5 line-clamp-2 text-sm font-medium text-[#3D4249]">
              {specialtyText}
            </p>

            {/* Evaluación real (solo si existen reseñas reales) + Experiencia */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#565C64]">
              {hasRealReviews ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#24272B]">
                  <Star
                    className="h-3.5 w-3.5 fill-[#F28C28] text-[#F28C28]"
                    aria-hidden="true"
                  />
                  {(professional.realAverageRating as number).toFixed(1)}
                  <span className="font-normal text-[#565C64]">
                    ({professional.realReviewCount})
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-[#6B717A]">
                  {locale === "es-AR"
                    ? "Sin reseñas aún"
                    : "Sem avaliações ainda"}
                </span>
              )}

              {professional.yearsOfExperience > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase
                    className="h-3.5 w-3.5 text-[#6D737C]"
                    aria-hidden="true"
                  />
                  {professional.yearsOfExperience}{" "}
                  {dictionary.profileCard.experienceYears}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Especialidades secundarias o servicios registrados */}
        {professional.secondarySpecialties.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {professional.secondarySpecialties.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="rounded-lg bg-[#F7F4EE] px-2.5 py-1 text-xs font-medium text-[#3A3E45] border border-[#E6DFD3]"
              >
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pie de tarjeta: Precio (solo cuando está registrado) + Modalidades + CTA */}
      <div className="mt-5 border-t border-[#ECE6DC] pt-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <div>
            {formattedReferencePrice ? (
              <>
                <span className="block text-[11px] text-[#666C75]">
                  {dictionary.profileCard.referenceFrom}
                </span>
                <p className="font-mono text-sm font-bold text-[#24272B]">
                  {formattedReferencePrice}{" "}
                  <span className="font-sans text-xs font-normal text-[#5A6068]">
                    ({professional.currency})
                  </span>
                </p>
              </>
            ) : (
              <p className="text-xs font-medium text-[#5A6068]">
                {dictionary.profileCard.referenceOnQuote}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {professional.acceptsDirectContact && (
              <span
                title={dictionary.profileCard.directContactBadge}
                className="inline-flex items-center gap-1 rounded-md bg-[#EFEAE1] px-2 py-1 text-[11px] font-medium text-[#24272B]"
              >
                <MessageSquare
                  className="h-3 w-3 text-[#F28C28]"
                  aria-hidden="true"
                />
                Chat
              </span>
            )}
            {professional.acceptsQuoteRequests && (
              <span
                title={dictionary.profileCard.quoteRequestBadge}
                className="inline-flex items-center gap-1 rounded-md bg-[#EFEAE1] px-2 py-1 text-[11px] font-medium text-[#24272B]"
              >
                <FileText
                  className="h-3 w-3 text-[#24272B]"
                  aria-hidden="true"
                />
                {locale === "es-AR" ? "Presupuesto" : "Orçamento"}
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/profissionais/${professional.slug}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#24272B] px-4 text-sm font-semibold text-[#F7F4EE] transition-colors hover:bg-[#32363C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
        >
          {dictionary.profileCard.viewProfileCta}
        </Link>
      </div>
    </article>
  );
}
