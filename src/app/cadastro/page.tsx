"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { REGION_CONFIGS } from "@/features/i18n/regions";
import { SERVICE_CATEGORIES } from "@/features/categories/data";
import { isValidPhoneForCountry, registerFormSchema } from "@/lib/validation/schemas";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/services/supabase/client";
import { Button } from "@/components/ui/Button";
import type { CountryCode } from "@/types/domain";

type RegistrationCity = { id?: string; name: string; region?: string };
type RegistrationField = "fullName" | "email" | "phone" | "country" | "city" | "password" | "confirmPassword" | "categorySlug";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegistrationField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cityData, setCityData] = useState<{
    country: CountryCode; cities: RegistrationCity[]; error: boolean;
  } | null>(null);
  const cityDataForCountry = cityData?.country === country ? cityData : null;
  const cityOptions = cityDataForCountry?.cities ?? [];
  const cityOptionsLoading = cityDataForCountry === null;
  const cityOptionsError = cityDataForCountry?.error ?? false;
  const activeRegionConfig = REGION_CONFIGS[country];

  const clearFieldError = (field: RegistrationField) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const fieldError = (field: RegistrationField) => {
    const message = fieldErrors[field];
    return message ? (
      <p id={`reg-${field}-error`} role="alert" className="mt-1 text-xs font-medium text-[#B93829]">
        {message}
      </p>
    ) : null;
  };
  const inputClass = "h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B] outline-none transition focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/20";

  useEffect(() => {
    const controller = new AbortController();

    const cityListPath = country === "BR" ? "/data/cities-BR.json" : "/data/cities-AR.json";
    fetch(cityListPath, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("cities_unavailable");
        return response.json() as Promise<RegistrationCity[]>;
      })
      .then((cities) => setCityData({ country, cities, error: false }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setCityData({ country, cities: [], error: true });
      });

    return () => controller.abort();
  }, [country]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const resolvedCity = city.trim();

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

    const nextErrors: Partial<Record<RegistrationField, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as RegistrationField;
        if (field in nextErrors || !(field in { fullName: 1, email: 1, phone: 1, country: 1, city: 1, password: 1, categorySlug: 1 })) continue;
        nextErrors[field] = field === "email"
          ? (locale === "es-AR" ? "Ingresá un correo válido." : "Informe um e-mail válido.")
          : field === "password"
            ? (locale === "es-AR" ? "La contraseña debe tener al menos 8 caracteres." : "A senha deve ter pelo menos 8 caracteres.")
            : (locale === "es-AR" ? "Completá este campo correctamente." : "Preencha este campo corretamente.");
      }
    }
    if (!isValidPhoneForCountry(phone, country)) {
      nextErrors.phone = country === "AR"
        ? (locale === "es-AR" ? "Ingresá un teléfono argentino válido con código de área." : "Informe um telefone argentino válido com código de área.")
        : (locale === "es-AR" ? "Ingresá un teléfono brasileño válido con DDD." : "Informe um telefone brasileiro válido com DDD.");
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = locale === "es-AR"
        ? "Las contraseñas no coinciden."
        : "As senhas não coincidem.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !parsed.success) {
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
            ? "Cuenta creada. Si necesitás confirmar tu correo, revisá tu bandeja de entrada."
            : "Conta criada. Se precisar confirmar seu e-mail, confira sua caixa de entrada."
        );
      } else {
        setErrorMsg(
          locale === "es-AR"
            ? "El registro no está disponible en este momento. Intentá de nuevo más tarde."
            : "O cadastro não está disponível neste momento. Tente novamente mais tarde."
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
                onChange={(e) => { setFullName(e.target.value); clearFieldError("fullName"); }}
                placeholder={dictionary.auth.fullNamePlaceholder}
                required
                autoComplete="name"
                maxLength={80}
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? "reg-fullName-error" : undefined}
                className={inputClass}
              />
              {fieldError("fullName")}
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
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                placeholder={dictionary.auth.emailPlaceholder}
                required
                maxLength={254}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "reg-email-error" : undefined}
                className={inputClass}
              />
              {fieldError("email")}
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
                  clearFieldError("country");
                  clearFieldError("city");
                  clearFieldError("phone");
                }}
                required
                aria-invalid={Boolean(fieldErrors.country)}
                aria-describedby={fieldErrors.country ? "reg-country-error" : undefined}
                className={inputClass}
              >
                <option value="AR">Argentina (ARS $)</option>
                <option value="BR">Brasil (BRL R$)</option>
              </select>
              {fieldError("country")}
            </div>

            <div>
              <label
                htmlFor="reg-city"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.cityLabel}
              </label>
              <input
                id="reg-city"
                type="search"
                list="reg-city-options"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => { setCity(e.target.value); clearFieldError("city"); }}
                placeholder={locale === "es-AR" ? "Buscá y elegí tu localidad" : "Pesquise e selecione sua cidade"}
                aria-describedby={fieldErrors.city ? "reg-city-hint reg-city-error" : "reg-city-hint"}
                required
                maxLength={120}
                aria-invalid={Boolean(fieldErrors.city)}
                className={inputClass}
              />
              <datalist id="reg-city-options">
                {cityOptions.map((option) => {
                  const value = option.region ? `${option.name}, ${option.region}` : option.name;
                  return <option key={option.id ?? value} value={value} />;
                })}
              </datalist>
              <p id="reg-city-hint" className="mt-1.5 text-xs leading-5 text-[#747A81]">
                {cityOptionsLoading
                  ? (locale === "es-AR" ? "Cargando localidades oficiales…" : "Carregando cidades oficiais…")
                  : cityOptionsError
                    ? (locale === "es-AR" ? "No se pudo cargar la lista. Podés escribir tu ciudad manualmente." : "Não foi possível carregar a lista. Você pode informar a cidade manualmente.")
                    : (locale === "es-AR" ? `${cityOptions.length.toLocaleString("es-AR")} localidades disponibles. Escribí para buscar.` : `${cityOptions.length.toLocaleString("pt-BR")} cidades disponíveis. Digite para pesquisar.`)}
              </p>
              {fieldError("city")}
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
                autoComplete="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearFieldError("phone"); }}
                placeholder={activeRegionConfig.phonePlaceholder}
                required
                maxLength={25}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "reg-phone-error" : "reg-phone-hint"}
                className={inputClass}
              />
              <p id="reg-phone-hint" className="mt-1 text-xs text-[#747A81]">
                {locale === "es-AR" ? "Código internacional:" : "Código internacional:"} {activeRegionConfig.phonePrefix}
              </p>
              {fieldError("phone")}
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {dictionary.auth.passwordLabel}
              </label>
              <div className="relative mt-1.5">
                <input
                  id="reg-password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); clearFieldError("confirmPassword"); }}
                  placeholder={dictionary.auth.passwordPlaceholder}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "reg-password-error" : "reg-password-hint"}
                  className={`${inputClass} pr-12`}
                />
                <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? (locale === "es-AR" ? "Ocultar contraseña" : "Ocultar senha") : (locale === "es-AR" ? "Mostrar contraseña" : "Mostrar senha")} aria-pressed={passwordVisible} className="absolute inset-y-0 right-1.5 grid w-10 place-items-center rounded-lg text-[#565C64] hover:bg-[#F7F4EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
                  {passwordVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <p id="reg-password-hint" className="mt-1 text-xs text-[#747A81]">{locale === "es-AR" ? "Usá al menos 8 caracteres." : "Use pelo menos 8 caracteres."}</p>
              {fieldError("password")}
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirm-password" className="mb-1.5 block text-xs font-bold text-[#24272B]">
              {locale === "es-AR" ? "Confirmar contraseña" : "Confirmar senha"}
            </label>
            <div className="relative">
              <input
                id="reg-confirm-password"
                type={confirmPasswordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                autoComplete="new-password"
                required
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? "reg-confirmPassword-error" : undefined}
                className={`${inputClass} pr-12`}
              />
              <button type="button" onClick={() => setConfirmPasswordVisible((visible) => !visible)} aria-label={confirmPasswordVisible ? (locale === "es-AR" ? "Ocultar confirmación" : "Ocultar confirmação") : (locale === "es-AR" ? "Mostrar confirmación" : "Mostrar confirmação")} aria-pressed={confirmPasswordVisible} className="absolute inset-y-0 right-1.5 grid w-10 place-items-center rounded-lg text-[#565C64] hover:bg-[#F7F4EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
                {confirmPasswordVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {fieldError("confirmPassword")}
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
                onChange={(e) => { setCategorySlug(e.target.value); clearFieldError("categorySlug"); }}
                required
                className={inputClass}
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
                  href="/entrar"
                  className="inline-flex rounded-lg bg-[#24272B] px-3 py-1.5 font-semibold text-white"
                >
                  {dictionary.nav.login}
                </Link>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
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
