"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Cookie,
  FileText,
  Info,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import {
  getLegalDocument,
  type LegalDocKey,
} from "@/features/legal/legalContent";

interface LegalPageClientProps {
  docKey: LegalDocKey;
}

export function LegalPageClient({ docKey }: LegalPageClientProps) {
  const { dictionary, locale } = useLocale();
  const isPortuguese = locale === "pt-BR";
  const doc = getLegalDocument(docKey, locale);

  const relatedLinks = [
    {
      key: "terms",
      href: "/termos-de-uso",
      icon: FileText,
      label: isPortuguese ? "Termos de Uso" : "Términos de Uso",
      desc: isPortuguese
        ? "Regras de cadastro, verificação, publicação e uso da plataforma."
        : "Reglas de registro, verificación, publicación y uso de la plataforma.",
    },
    {
      key: "privacy",
      href: "/politica-de-privacidade",
      icon: ShieldCheck,
      label: isPortuguese
        ? "Política de Privacidade"
        : "Política de Privacidad",
      desc: isPortuguese
        ? "Como tratamos dados públicos e privados com segurança."
        : "Cómo tratamos datos públicos y privados con seguridad.",
    },
    {
      key: "lgpd",
      href: "/politica-de-privacidade#lgpd",
      icon: Lock,
      label: isPortuguese
        ? "Proteção de Dados e LGPD"
        : "Protección de Datos y LGPD",
      desc: isPortuguese
        ? "Direitos do titular na LGPD (Brasil) e Ley 25.326 (Argentina)."
        : "Derechos del titular bajo la Ley 25.326 (Argentina) y LGPD (Brasil).",
    },
    {
      key: "cookies",
      href: "/politica-de-cookies",
      icon: Cookie,
      label: isPortuguese ? "Política de Cookies" : "Política de Cookies",
      desc: isPortuguese
        ? "Uso de cookies essenciais de sessão e preferência regional."
        : "Uso de cookies esenciales de sesión y preferencia regional.",
    },
  ];

  return (
    <div className="bg-[#F7F4EE]">
      {/* Cabeçalho editorial escuro */}
      <section className="border-b border-[#2E3238] bg-[#24272B] text-[#F7F4EE]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-11">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Breadcrumb
              variant="on-dark"
              items={[
                { label: dictionary.nav.home, href: "/" },
                { label: doc.breadcrumbLabel },
              ]}
            />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D6D0C6] transition-colors hover:text-[#F28C28]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isPortuguese ? "Voltar ao início" : "Volver al inicio"}
              </span>
            </Link>
          </div>

          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="emerald">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{doc.badge}</span>
              </Badge>
              {doc.jurisdictions.map((j) => (
                <span
                  key={j}
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold text-[#E6E1D8]"
                >
                  {j}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {doc.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#CFCAC0] sm:text-base">
              {doc.subtitle}
            </p>
            <p className="mt-4 font-mono text-xs text-[#A8A298]">
              {doc.lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo principal + Índice lateral */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Índice lateral */}
          <aside className="lg:col-span-4">
            <div className="space-y-5 lg:sticky lg:top-36">
              <nav
                aria-label={
                  isPortuguese
                    ? "Índice do documento"
                    : "Índice del documento"
                }
                className="rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-2xs"
              >
                <h2 className="text-xs font-extrabold tracking-wider text-[#565C64] uppercase">
                  {isPortuguese ? "Neste documento" : "En este documento"}
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {doc.sections.map((sec) => (
                    <li key={sec.id}>
                      <a
                        href={`#${sec.id}`}
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-[#3D4249] transition-colors hover:bg-[#F7F4EE] hover:text-[#A65206] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                      >
                        {sec.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="rounded-2xl border border-[#C6E2D4] bg-[#EDF7F1] p-5">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#15573B]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{doc.summaryBox.title}</span>
                </h2>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#1F4B38]">
                  {doc.summaryBox.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#15573B]"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Artigo legal */}
          <article className="lg:col-span-8">
            <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-2xs sm:p-8 lg:p-10">
              <div className="max-w-3xl space-y-9">
                {doc.sections.map((sec) => (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="scroll-mt-36 border-b border-[#EFEAE1] pb-8 last:border-b-0 last:pb-0"
                  >
                    <h2 className="text-lg font-extrabold tracking-tight text-[#24272B] sm:text-xl">
                      {sec.title}
                    </h2>

                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#3D4249] sm:text-[15px]">
                      {sec.paragraphs.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>

                    {sec.bullets && sec.bullets.length > 0 && (
                      <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#3D4249]">
                        {sec.bullets.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 rounded-xl border border-[#EFEAE1] bg-[#FAF8F4] px-3.5 py-2.5"
                          >
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F28C28]"
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {sec.callout && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#E6D3B8] bg-[#FEF8EF] p-4 text-xs leading-relaxed text-[#5C3A16] sm:text-sm">
                        <Info
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#B8630B]"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="font-extrabold text-[#24272B]">
                            {sec.callout.title}
                          </p>
                          <p className="mt-1 text-[#4A3723]">
                            {sec.callout.body}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                ))}

                {/* Nota transparente de governança / canal de conta */}
                <div className="rounded-2xl border border-[#DFD8CC] bg-[#F7F4EE] p-5 text-xs leading-relaxed text-[#4B5159] sm:text-sm">
                  <p className="font-extrabold text-[#24272B]">
                    {doc.governanceNote.title}
                  </p>
                  <p className="mt-1.5">{doc.governanceNote.body}</p>
                </div>
              </div>
            </div>

            {/* Navegação entre documentos legais */}
            <section
              aria-label={
                isPortuguese
                  ? "Outros documentos legais"
                  : "Otros documentos legales"
              }
              className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {relatedLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === docKey;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] ${
                      isActive
                        ? "border-[#24272B] bg-[#24272B] text-white"
                        : "border-[#DFD8CC] bg-white text-[#24272B] hover:border-[#F28C28]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-[#F28C28] text-[#1B1E22]"
                          : "bg-[#F7F4EE] text-[#A65206]"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">{item.label}</p>
                      <p
                        className={`mt-0.5 text-xs leading-relaxed ${
                          isActive ? "text-[#D6D0C6]" : "text-[#565C64]"
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
