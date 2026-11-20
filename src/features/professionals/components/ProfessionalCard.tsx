"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  FileText,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatRegionalCurrency } from "@/features/i18n/regions";
import { getCategoryBySlug } from "@/features/categories/data";
import type { RealProfessionalListItem } from "@/services/supabase/professionals";

interface ProfessionalCardProps {
  professional: RealProfessionalListItem;
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const { dictionary, locale, tText } = useLocale();
  const isPortuguese = locale === "pt-BR";

  const specialtyText = isPortuguese
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

  const category = getCategoryBySlug(professional.categorySlug);
  const visibleSpecialties = professional.secondarySpecialties.slice(0, 3);
  const extraSpecialtiesCount = Math.max(
    0,
    professional.secondarySpecialties.length - visibleSpecialties.length
  );

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#DFD8CC] bg-white shadow-[0_1px_2px_rgba(27,30,34,0.04)] transition-all duration-150 hover:border-[#C5BBAE] hover:shadow-[0_8px_24px_rgba(27,30,34,0.08)]">
      {/* Corpo principal */}
      <div className="p-5">
        {/* Selo de confiança + Categoria/País */}
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <Badge variant="emerald">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{isPortuguese ? "Perfil verificado" : "Perfil verificado"}</span>
          </Badge>

          <span className="inline-flex items-center gap-1 rounded-md bg-[#F7F4EE] px-2 py-0.5 text-[11px] font-semibold text-[#565C64]">
            {professional.country === "BR" ? "BR · BRL" : "AR · ARS"}
          </span>
        </div>

        {/* Identidade + Especialidade */}
        <div className="flex items-start gap-3.5">
          <UserAvatar
            src={professional.avatarUrl}
            name={professional.fullName}
            size="md"
            shape="rounded"
            className="ring-1 ring-[#E4DDD2]"
          />

          <div className="min-w-0 flex-1">
            {category && (
              <p className="truncate text-[11px] font-bold text-[#A65206]">
                {tText(category.name)}
              </p>
            )}
            <h3 className="mt-0.5 truncate text-base font-extrabold text-[#24272B] transition-colors group-hover:text-[#A65206]">
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
          </div>
        </div>

        {/* Metadados escaneáveis: Localização, Avaliação real, Experiência */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-[#565C64]">
          {locationLabel && (
            <span className="inline-flex min-w-0 items-center gap-1 font-medium text-[#3D4249]">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 text-[#F28C28]"
                aria-hidden="true"
              />
              <span className="truncate">{locationLabel}</span>
            </span>
          )}

          {hasRealReviews ? (
            <span className="inline-flex items-center gap-1 font-bold text-[#24272B] tabular-nums">
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
            <span className="text-[11px] font-medium text-[#6B717A]">
              {isPortuguese ? "Sem avaliações ainda" : "Sin reseñas aún"}
            </span>
          )}

          {professional.yearsOfExperience > 0 && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Briefcase
                className="h-3.5 w-3.5 shrink-0 text-[#6D737C]"
                aria-hidden="true"
              />
              {professional.yearsOfExperience}{" "}
              {dictionary.profileCard.experienceYears}
            </span>
          )}
        </div>

        {/* Chips de especialidades ou serviços */}
        {visibleSpecialties.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {visibleSpecialties.map((spec) => (
              <span
                key={spec}
                className="rounded-lg border border-[#E6DFD3] bg-[#F7F4EE] px-2.5 py-0.5 text-xs font-medium text-[#353940]"
              >
                {spec}
              </span>
            ))}
            {extraSpecialtiesCount > 0 && (
              <span className="rounded-lg bg-[#EFEAE1] px-2 py-0.5 text-xs font-semibold text-[#565C64]">
                +{extraSpecialtiesCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Faixa comercial inferior: Preço + Modalidades + CTAs */}
      <div className="border-t border-[#ECE6DC] bg-[#FAF8F4] px-5 py-4">
        <div className="mb-3.5 flex items-end justify-between gap-2">
          <div>
            {formattedReferencePrice ? (
              <>
                <span className="block text-[11px] font-medium text-[#565C64]">
                  {dictionary.profileCard.referenceFrom}
                </span>
                <p className="font-mono text-base font-bold text-[#24272B] tabular-nums">
                  {formattedReferencePrice}
                </p>
              </>
            ) : (
              <p className="text-xs font-semibold text-[#565C64]">
                {dictionary.profileCard.referenceOnQuote}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {professional.acceptsDirectContact && (
              <span
                title={dictionary.profileCard.directContactBadge}
                className="inline-flex items-center gap-1 rounded-md border border-[#E4DDD2] bg-white px-2 py-1 text-[11px] font-semibold text-[#24272B]"
              >
                <MessageSquare
                  className="h-3 w-3 text-[#A65206]"
                  aria-hidden="true"
                />
                Chat
              </span>
            )}
            {professional.acceptsQuoteRequests && (
              <span
                title={dictionary.profileCard.quoteRequestBadge}
                className="inline-flex items-center gap-1 rounded-md border border-[#E4DDD2] bg-white px-2 py-1 text-[11px] font-semibold text-[#24272B]"
              >
                <FileText
                  className="h-3 w-3 text-[#24272B]"
                  aria-hidden="true"
                />
                {isPortuguese ? "Orçamento" : "Presupuesto"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/profissionais/${professional.slug}`}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-[#24272B] px-3.5 text-sm font-semibold text-[#F7F4EE] transition-colors hover:bg-[#32363C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
          >
            <span>{dictionary.profileCard.viewProfileCta}</span>
            <ChevronRight className="h-4 w-4 text-[#F28C28]" aria-hidden="true" />
          </Link>

          {professional.acceptsQuoteRequests && (
            <Link
              href={`/profissionais/${professional.slug}?action=quote`}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-[#DF7B18]/45 bg-[#FEF3E7] px-3 text-xs font-bold text-[#9A4E06] transition-colors hover:bg-[#F28C28] hover:text-[#1B1E22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              {dictionary.profileCard.requestQuoteCta}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
