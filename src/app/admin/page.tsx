"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  BarChart2,
  FolderKanban,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { Badge } from "@/components/ui/Badge";

type AdminModuleId = "categories" | "reports" | "verifications" | "metrics";

export default function AdminAreaPreviewPage() {
  const { dictionary, locale } = useLocale();
  const [activeModule, setActiveModule] = useState<AdminModuleId>("categories");

  const modules: { id: AdminModuleId; label: string; icon: React.ReactNode }[] =
    [
      {
        id: "categories",
        label:
          locale === "es-AR"
            ? "Gestión de categorías y especialidades"
            : "Gestão de categorias e especialidades",
        icon: <FolderKanban className="h-4 w-4" />,
      },
      {
        id: "reports",
        label:
          locale === "es-AR"
            ? "Moderación de denuncias, fotos y reseñas"
            : "Moderação de denúncias, fotos e avaliações",
        icon: <AlertOctagon className="h-4 w-4" />,
      },
      {
        id: "verifications",
        label:
          locale === "es-AR"
            ? "Solicitudes de verificación documental"
            : "Pedidos de verificação documental",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        id: "metrics",
        label:
          locale === "es-AR"
            ? "Suspensiones y métricas generales"
            : "Suspensões e métricas gerais",
        icon: <BarChart2 className="h-4 w-4" />,
      },
    ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Aviso crítico de seguridad para el panel administrativo */}
      <div className="mb-6 rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-4 text-xs text-[#8C2318]">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#B93829]" />
          <div>
            <p className="font-bold">
              {locale === "es-AR"
                ? "Arquitectura de Seguridad Administrativa (No confía en el cliente)"
                : "Arquitetura de Segurança Administrativa (Não confia no cliente)"}
            </p>
            <p className="mt-0.5 leading-relaxed">
              {dictionary.privateAreas.securityWarning}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-[#DFD8CC] pb-6">
        <Badge variant="graphite">Rol: Administrador · Sección 8 del Documento Funcional</Badge>
        <h1 className="mt-2 text-3xl font-extrabold text-[#24272B]">
          {dictionary.privateAreas.adminTitle}
        </h1>
        <p className="mt-1 text-sm text-[#525860]">
          {dictionary.privateAreas.adminSubtitle}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <nav
          aria-label="Módulos del panel administrativo"
          className="space-y-1.5 lg:col-span-4"
        >
          {modules.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => setActiveModule(mod.id)}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                activeModule === mod.id
                  ? "bg-[#24272B] text-[#F7F4EE]"
                  : "border border-[#DFD8CC] bg-white text-[#3D4249] hover:bg-[#EFEAE1]"
              }`}
            >
              <span className="text-[#F28C28]">{mod.icon}</span>
              <span>{mod.label}</span>
            </button>
          ))}
        </nav>

        <section className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-2xs lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE6DC] pb-4">
            <h2 className="text-lg font-bold text-[#24272B]">
              {modules.find((m) => m.id === activeModule)?.label}
            </h2>
            <Badge variant="demo">Vista Estructural Fase 1</Badge>
          </div>

          <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#42474F]">
            {activeModule === "categories" && (
              <p>
                {locale === "es-AR"
                  ? "Alta, edición y ordenamiento de categorías oficiales (Construcción, Hogar, Electricidad y Gas, Belleza y Bienestar, Jardinería, Transporte, Salud y Otros) y sus subcategorías en español argentino y portugués brasileño."
                  : "Criação, edição e ordenação das categorias oficiais (Construção, Casa e Reparos, Elétrica e Gás, Beleza e Bem-estar, Jardinagem, Transporte, Saúde e Outros) e suas subcategorias em português brasileiro e espanhol argentino."}
              </p>
            )}
            {activeModule === "reports" && (
              <p>
                {locale === "es-AR"
                  ? "Cola de auditoría para analizar denuncias de usuarios sobre perfiles, fotos de galería o reseñas que infrinjan las normas de convivencia."
                  : "Fila de auditoria para analisar denúncias de usuários sobre perfis, fotos de portfólio ou avaliações que violem as regras da comunidade."}
              </p>
            )}
            {activeModule === "verifications" && (
              <p>
                {locale === "es-AR"
                  ? "Revisión de documentación y matrículas profesionales (por ejemplo, gasistas matriculados o profesionales de salud habilitados). El sello de verificación solo se otorga tras este proceso real y documentado."
                  : "Análise de documentação e registros profissionais (por exemplo, instaladores de gás ou profissionais de saúde habilitados). O selo de verificação só é concedido após esse processo real e documentado."}
              </p>
            )}
            {activeModule === "metrics" && (
              <p className="flex items-start gap-2">
                <UserX className="mt-0.5 h-4 w-4 shrink-0 text-[#B93829]" />
                <span>
                  {locale === "es-AR"
                    ? "Suspensión preventiva o definitiva de cuentas que incumplan las reglas y consulta de métricas operativas reales por país (Argentina / Brasil)."
                    : "Suspensão preventiva ou definitiva de contas que violem as regras e consulta de métricas operacionais reais por país (Brasil / Argentina)."}
                </span>
              </p>
            )}

            <div className="rounded-xl border border-[#E4DDD2] bg-[#F7F4EE] p-4 text-xs">
              <p className="font-mono font-bold text-[#24272B]">
                Control de Autorización en Servidor (Fase 2):
              </p>
              <p className="mt-1 text-[#525860]">
                {locale === "es-AR"
                  ? "El rol de administrador se verificará mediante Custom Claims / tabla protegida en PostgreSQL con RLS estricto, jamás mediante variables en el navegador."
                  : "O papel de administrador será verificado via Custom Claims / tabela protegida no PostgreSQL com RLS estrito, jamais por variáveis no navegador."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
