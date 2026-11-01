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
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-xs sm:p-8">
        <h1 className="text-2xl font-extrabold text-[#24272B]">
          {dictionary.auth.loginTitle}
        </h1>
        <p className="mt-1.5 text-sm text-[#525860]">
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
              className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-xs font-bold text-[#24272B]"
            >
            {passwordRecovery ? (locale === "es-AR" ? "Te enviaremos un enlace seguro" : "Enviaremos um link seguro") : dictionary.auth.passwordLabel}
            </label>
            {!passwordRecovery && <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={dictionary.auth.passwordPlaceholder}
              className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm text-[#24272B] focus:border-[#F28C28] focus:outline-none"
            />}
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
              {!passwordRecovery && <div className="mt-2.5 flex flex-wrap gap-2">
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
              </div>}
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
              ? (locale === "es-AR" ? "Enviar enlace" : "Enviar link")
              : dictionary.nav.login}
          </Button>
          <button type="button" onClick={() => { setPasswordRecovery((current) => !current); setErrorMsg(null); setAuthSuccessMessage(null); }} className="w-full text-center text-xs font-semibold text-[#A75508] hover:underline">
            {passwordRecovery
              ? (locale === "es-AR" ? "Volver al inicio de sesión" : "Voltar para entrar")
              : (locale === "es-AR" ? "Olvidé mi contraseña" : "Esqueci minha senha")}
          </button>
        </form>

        <div className="mt-6 border-t border-[#ECE6DC] pt-4 text-center text-xs text-[#525860]">
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
