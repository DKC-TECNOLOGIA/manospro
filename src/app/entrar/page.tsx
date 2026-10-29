"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { loginFormSchema } from "@/lib/validation/schemas";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/services/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function LoginPage() {
  const { dictionary, locale } = useLocale();
  const supabaseReady = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setAuthSuccessMessage(null);

    const validation = loginFormSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMsg(
        locale === "es-AR"
          ? "Ingresá un correo electrónico válido y una contraseña de al menos 8 caracteres."
          : "Informe um e-mail válido e uma senha com pelo menos 8 caracteres."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (supabaseReady) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        setAuthSuccessMessage(
          locale === "es-AR"
            ? "¡Sesión iniciada correctamente con Supabase Auth!"
            : "Sessão iniciada com sucesso via Supabase Auth!"
        );
      } else {
        setAuthSuccessMessage(
          locale === "es-AR"
            ? "Credenciales validadas con Zod (Configurá .env.local para login real)."
            : "Credenciais validadas com Zod (Configure o .env.local para login real)."
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : locale === "es-AR"
            ? "Error inesperado al intentar ingresar."
            : "Erro inesperado ao tentar entrar."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-xs sm:p-8">
        <Badge variant={supabaseReady ? "emerald" : "demo"} className="mb-3">
          {supabaseReady
            ? "Supabase Auth Conectado"
            : "Fase 1 · Auth Preview"}
        </Badge>
        <h1 className="text-2xl font-extrabold text-[#24272B]">
          {dictionary.auth.loginTitle}
        </h1>
        <p className="mt-1.5 text-sm text-[#525860]">
          {dictionary.auth.loginSubtitle}
        </p>

        {/* Estado de conexión con Supabase */}
        <div className="mt-4 rounded-xl border border-[#A7D7C2] bg-[#EAF5F0] p-3.5 text-xs text-[#176041]">
          <p className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              {locale === "es-AR"
                ? "Autenticación protegida con Supabase Auth + RLS"
                : "Autenticação protegida com Supabase Auth + RLS"}
            </span>
          </p>
          <p className="mt-1 leading-relaxed">
            {locale === "es-AR"
              ? "Tus credenciales se verifican directamente contra Supabase Auth sin exponer claves privadas en el navegador."
              : "Suas credenciais são verificadas diretamente no Supabase Auth sem expor chaves privadas no navegador."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-xs font-bold text-[#24272B]"
            >
              {dictionary.auth.emailLabel}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dictionary.auth.emailPlaceholder}
              className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-xs font-bold text-[#24272B]"
            >
              {dictionary.auth.passwordLabel}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={dictionary.auth.passwordPlaceholder}
              className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-[#E5A49B] bg-[#FDF2F0] p-3 text-xs font-semibold text-[#B93829]"
            >
              {errorMsg}
            </div>
          )}

          {authSuccessMessage && (
            <div
              role="status"
              className="rounded-xl border border-[#A7D7C2] bg-[#EAF5F0] p-3.5 text-xs text-[#176041]"
            >
              <p className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {authSuccessMessage}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Link
                  href="/cliente"
                  className="rounded-lg bg-[#176041] px-2.5 py-1 font-semibold text-white"
                >
                  {dictionary.nav.clientArea}
                </Link>
                <Link
                  href="/profissional"
                  className="rounded-lg bg-[#24272B] px-2.5 py-1 font-semibold text-white"
                >
                  {dictionary.nav.proArea}
                </Link>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
            leftIcon={<Lock className="h-4 w-4" />}
          >
            {dictionary.nav.login}
          </Button>
        </form>

        <div className="mt-6 border-t border-[#ECE6DC] pt-4 text-center text-xs text-[#525860]">
          <p>{dictionary.auth.forgotPassword}</p>
          <p className="mt-2">
            {dictionary.auth.noAccountText}{" "}
            <Link
              href="/cadastro"
              className="font-bold text-[#C86D14] hover:underline"
            >
              {dictionary.auth.goToRegister}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
