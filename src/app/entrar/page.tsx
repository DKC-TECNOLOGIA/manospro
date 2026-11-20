"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { loginFormSchema } from "@/lib/validation/schemas";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/services/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { dictionary, locale } = useLocale();
  const supabaseReady = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setAuthSuccessMessage(null);

    if (passwordRecovery) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMsg(locale === "es-AR" ? "Ingresá un correo electrónico válido." : "Informe um e-mail válido.");
        return;
      }
      setIsSubmitting(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        if (error) setErrorMsg(error.message);
        else setAuthSuccessMessage(locale === "es-AR"
          ? "Si existe una cuenta para este correo, recibirás un enlace para cambiar la contraseña."
          : "Se houver uma conta para este e-mail, você receberá um link para redefinir a senha.");
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Não foi possível solicitar a redefinição.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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

        const { data: isAdmin } = await supabase.rpc("is_admin");
        if (isAdmin === true) {
          router.replace("/admin");
          return;
        }

        const requestedPath = new URLSearchParams(window.location.search).get("next");
        if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//")) {
          router.replace(requestedPath);
          return;
        }

        setAuthSuccessMessage(
          locale === "es-AR"
            ? "Sesión iniciada correctamente."
            : "Sessão iniciada com sucesso."
        );
      } else {
        setErrorMsg(
          locale === "es-AR"
            ? "El acceso no está disponible en este momento. Intentá de nuevo más tarde."
            : "O acesso não está disponível neste momento. Tente novamente mais tarde."
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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#DFD8CC] bg-white shadow-sm lg:grid-cols-12">
        <div className="hidden flex-col justify-between bg-[#24272B] p-8 text-[#F7F4EE] lg:col-span-5 lg:flex">
          <div>
            <span className="inline-flex rounded-lg bg-[#F28C28]/15 px-2.5 py-1 text-xs font-bold text-[#F28C28]">
              ManosPro
            </span>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight text-white">
              {locale === "es-AR"
                ? "Conectá con profesionales verificados en tu zona"
                : "Conecte-se com profissionais verificados na sua região"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#CFCAC0]">
              {locale === "es-AR"
                ? "Gestioná tus consultas, presupuestos y conversaciones privadas desde un solo lugar."
                : "Gerencie suas conversas, solicitações de orçamento e serviços em um só lugar."}
            </p>
          </div>
          <p className="border-t border-white/10 pt-4 text-xs text-[#B9B3A9]">
            {locale === "es-AR"
              ? "Argentina (ARS) · Brasil (BRL)"
              : "Brasil (BRL) · Argentina (ARS)"}
          </p>
        </div>

        <div className="p-6 sm:p-8 lg:col-span-7">
          <h1 className="text-2xl font-extrabold text-[#24272B]">
            {dictionary.auth.loginTitle}
          </h1>
          <p className="mt-1.5 text-sm text-[#565C64]">
            {dictionary.auth.loginSubtitle}
          </p>

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
                className="h-11 w-full rounded-xl border border-[#CFC6B8] bg-white px-3.5 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/25"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-xs font-bold text-[#24272B]"
              >
                {passwordRecovery
                  ? locale === "es-AR"
                    ? "Te enviaremos un enlace seguro"
                    : "Enviaremos um link seguro"
                  : dictionary.auth.passwordLabel}
              </label>
              {!passwordRecovery && (
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={dictionary.auth.passwordPlaceholder}
                  className="h-11 w-full rounded-xl border border-[#CFC6B8] bg-white px-3.5 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/25"
                />
              )}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-[#E5A49B] bg-[#FDF2F0] p-3 text-xs font-semibold text-[#A62C1E]"
              >
                {errorMsg}
              </div>
            )}

            {authSuccessMessage && (
              <div
                role="status"
                className="rounded-xl border border-[#A7D7C2] bg-[#EAF5F0] p-3.5 text-xs text-[#15573B]"
              >
                <p className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {authSuccessMessage}
                </p>
                {!passwordRecovery && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Link
                      href="/cliente"
                      className="rounded-lg bg-[#15573B] px-2.5 py-1 font-semibold text-white"
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
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              leftIcon={<Lock className="h-4 w-4" />}
            >
              {passwordRecovery
                ? locale === "es-AR"
                  ? "Enviar enlace"
                  : "Enviar link"
                : dictionary.nav.login}
            </Button>
            <button
              type="button"
              onClick={() => {
                setPasswordRecovery((current) => !current);
                setErrorMsg(null);
                setAuthSuccessMessage(null);
              }}
              className="w-full cursor-pointer text-center text-xs font-bold text-[#A65206] hover:underline"
            >
              {passwordRecovery
                ? locale === "es-AR"
                  ? "Volver al inicio de sesión"
                  : "Voltar para entrar"
                : locale === "es-AR"
                  ? "Olvidé mi contraseña"
                  : "Esqueci minha senha"}
            </button>
          </form>

          <div className="mt-6 border-t border-[#ECE6DC] pt-4 text-center text-xs text-[#565C64]">
            <p className="mt-2">
              {dictionary.auth.noAccountText}{" "}
              <Link
                href="/cadastro"
                className="font-bold text-[#A65206] hover:underline"
              >
                {dictionary.auth.goToRegister}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
