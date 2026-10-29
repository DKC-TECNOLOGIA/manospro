"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CITY_ZONES, REGION_CONFIGS } from "@/features/i18n/regions";
import { SERVICE_CATEGORIES } from "@/features/categories/data";
import { registerFormSchema } from "@/lib/validation/schemas";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/services/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { CountryCode } from "@/types/domain";

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const { country, dictionary, locale, setCountry, tText } = useLocale();
  const supabaseReady = isSupabaseConfigured();

  const initialRole =
    searchParams.get("role") === "professional" ? "professional" : "client";

  const [role, setRole] = useState<"client" | "professional">(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [categorySlug, setCategorySlug] = useState("electricidad-y-gas");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const regionalCities = CITY_ZONES.filter((z) => z.country === country);
  const activeRegionConfig = REGION_CONFIGS[country];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const resolvedCity =
      city || regionalCities[0]?.city || activeRegionConfig.defaultCity;

    const parsed = registerFormSchema.safeParse({
      role,
      fullName,
      email,
      phone,
      country,
      city: resolvedCity,
      categorySlug: role === "professional" ? categorySlug : undefined,
      password,
    });

    if (!parsed.success) {
      setErrorMsg(
        locale === "es-AR"
          ? "Por favor revisá todos los campos: nombre completo, correo válido, teléfono y contraseña (mín. 8 caracteres)."
          : "Por favor revise todos os campos: nome completo, e-mail válido, telefone e senha (mín. 8 caracteres)."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (supabaseReady) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: {
              role: parsed.data.role,
              full_name: parsed.data.fullName,
              phone: parsed.data.phone,
              country: parsed.data.country,
              city: parsed.data.city,
              category_slug: parsed.data.categorySlug ?? "hogar",
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        setSuccessMsg(
          locale === "es-AR"
            ? "¡Cuenta creada en Supabase! Si tenés confirmación de correo activa en Supabase, revisá tu bandeja de entrada."
            : "Conta criada no Supabase! Se a confirmação por e-mail estiver ativa no Supabase, verifique sua caixa de entrada."
        );
      } else {
        setSuccessMsg(
          locale === "es-AR"
            ? "Datos validados correctamente."
            : "Dados validados com sucesso."
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : locale === "es-AR"
            ? "Error inesperado al registrar la cuenta."
            : "Erro inesperado ao cadastrar a conta."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-xs sm:p-8">
        <Badge variant={supabaseReady ? "emerald" : "demo"} className="mb-3">
          {supabaseReady
            ? "Supabase Auth + Trigger RLS Conectado"
            : "Fase 1 · Registro Estructural"}
        </Badge>
        <h1 className="text-2xl font-extrabold text-[#24272B] sm:text-3xl">
          {dictionary.auth.registerTitle}
        </h1>
        <p className="mt-1.5 text-sm text-[#525860]">
          {dictionary.auth.registerSubtitle}
        </p>

        {/* Selección de tipo de cuenta: Cliente vs Profesional */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("client")}
            aria-pressed={role === "client"}
            className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
              role === "client"
                ? "border-[#24272B] bg-[#24272B] text-[#F7F4EE]"
                : "border-[#D4CCC0] bg-[#F7F4EE]/60 text-[#24272B] hover:border-[#24272B]"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <UserCheck className="h-4 w-4 text-[#F28C28]" />
              <span>{dictionary.auth.roleClientTitle}</span>
            </div>
            <p
              className={`mt-1 text-xs leading-relaxed ${
                role === "client" ? "text-[#D4CFC6]" : "text-[#525860]"
              }`}
            >
              {dictionary.auth.roleClientDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRole("professional")}
            aria-pressed={role === "professional"}
            className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
              role === "professional"
                ? "border-[#24272B] bg-[#24272B] text-[#F7F4EE]"
                : "border-[#D4CCC0] bg-[#F7F4EE]/60 text-[#24272B] hover:border-[#24272B]"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <Briefcase className="h-4 w-4 text-[#F28C28]" />
              <span>{dictionary.auth.roleProTitle}</span>
            </div>
            <p
              className={`mt-1 text-xs leading-relaxed ${
                role === "professional" ? "text-[#D4CFC6]" : "text-[#525860]"
              }`}
            >
              {dictionary.auth.roleProDesc}
            </p>
          </button>
        </div>

        {/* Estado de conexión con Supabase */}
        <div className="mt-5 rounded-xl border border-[#A7D7C2] bg-[#EAF5F0] p-3.5 text-xs text-[#176041]">
          <p className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              {locale === "es-AR"
                ? "Alta automática con Trigger SQL y Row Level Security"
                : "Cadastro automático com Trigger SQL e Row Level Security"}
            </span>
          </p>
          <p className="mt-1">
            {locale === "es-AR"
              ? "Al registrarte, el trigger `on_auth_user_created` crea tu perfil en `public.profiles` (y tu ficha en borrador en `public.professional_profiles` si sos profesional)."
              : "Ao se cadastrar, o trigger `on_auth_user_created` cria seu perfil em `public.profiles` (e seu rascunho em `public.professional_profiles` se for profissional)."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-name"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.fullNameLabel}
              </label>
              <input
                id="reg-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={dictionary.auth.fullNamePlaceholder}
                className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B]"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.emailLabel}
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={dictionary.auth.emailPlaceholder}
                className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-country"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.countryLabel}
              </label>
              <select
                id="reg-country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value as CountryCode);
                  setCity("");
                }}
                className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm text-[#24272B]"
              >
                <option value="AR">Argentina (ARS $)</option>
                <option value="BR">Brasil (BRL R$)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reg-city"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.cityLabel}
              </label>
              <select
                id="reg-city"
                value={city || regionalCities[0]?.city || ""}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm text-[#24272B]"
              >
                {regionalCities.map((z) => (
                  <option key={z.id} value={z.city}>
                    {z.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-phone"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.phoneLabel}
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={activeRegionConfig.phonePlaceholder}
                className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B]"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.passwordLabel}
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={dictionary.auth.passwordPlaceholder}
                className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B]"
              />
            </div>
          </div>

          {role === "professional" && (
            <div>
              <label
                htmlFor="reg-category"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.specialtyLabel}
              </label>
              <select
                id="reg-category"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm text-[#24272B]"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {tText(cat.name)} — {cat.examples[locale].join(", ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-[#E5A49B] bg-[#FDF2F0] p-3 text-xs font-semibold text-[#B93829]"
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="rounded-xl border border-[#A7D7C2] bg-[#EAF5F0] p-4 text-xs text-[#176041]"
            >
              <p className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </p>
              <div className="mt-3">
                <Link
                  href={role === "professional" ? "/profissional" : "/cliente"}
                  className="inline-flex rounded-lg bg-[#24272B] px-3 py-1.5 font-semibold text-white"
                >
                  {role === "professional"
                    ? dictionary.nav.proArea
                    : dictionary.nav.clientArea}
                </Link>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            {dictionary.nav.register}
          </Button>
        </form>

        <div className="mt-6 border-t border-[#ECE6DC] pt-4 text-center text-xs text-[#525860]">
          {dictionary.auth.alreadyHaveAccount}{" "}
          <Link
            href="/entrar"
            className="font-bold text-[#C86D14] hover:underline"
          >
            {dictionary.nav.login}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-[#525860]">
          Cargando registro...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
