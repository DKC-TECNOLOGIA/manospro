"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, LockKeyhole } from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/services/supabase/client";

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const isPortuguese = locale === "pt-BR";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let active = true;

    const initializeRecovery = async () => {
      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const authError =
        url.searchParams.get("error_description") ??
        hashParams.get("error_description");
      const errorCode =
        url.searchParams.get("error_code") ?? hashParams.get("error_code");

      if (authError || errorCode) {
        if (!active) return;
        setErrorMessage(
          errorCode === "otp_expired"
            ? isPortuguese
              ? "Este link expirou ou já foi usado. Solicite uma nova redefinição de senha e abra o link mais recente."
              : "Este enlace expiró o ya fue utilizado. Solicitá un nuevo restablecimiento y abrí el enlace más reciente."
            : isPortuguese
              ? "Não foi possível validar este link. Solicite uma nova redefinição de senha."
              : "No se pudo validar este enlace. Solicitá un nuevo restablecimiento de contraseña."
        );
        setSessionReady(false);
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setErrorMessage(
            isPortuguese
              ? "Este link expirou ou já foi usado. Solicite uma nova redefinição de senha."
              : "Este enlace expiró o ya fue usado. Solicitá un nuevo restablecimiento de contraseña."
          );
          setSessionReady(false);
          return;
        }
        window.history.replaceState({}, document.title, url.pathname);
        setSessionReady(true);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setErrorMessage(
          isPortuguese
            ? "Não encontramos uma sessão de recuperação válida. Solicite um novo link para redefinir a senha."
            : "No encontramos una sesión de recuperación válida. Solicitá un nuevo enlace para restablecer la contraseña."
        );
        setSessionReady(false);
      } else {
        setSessionReady(true);
      }
    };

    initializeRecovery().catch(() => {
      if (active) {
        setErrorMessage(
          isPortuguese
            ? "Não foi possível validar o link. Solicite uma nova redefinição de senha."
            : "No se pudo validar el enlace. Solicitá un nuevo restablecimiento de contraseña."
        );
        setSessionReady(false);
      }
    });

    return () => {
      active = false;
    };
  }, [isPortuguese]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage(
        isPortuguese
          ? "A nova senha precisa ter pelo menos 8 caracteres."
          : "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }
    if (password !== confirmation) {
      setErrorMessage(
        isPortuguese
          ? "As senhas informadas não são iguais."
          : "Las contraseñas ingresadas no coinciden."
      );
      return;
    }
    if (!isSupabaseConfigured()) {
      setErrorMessage(
        isPortuguese
          ? "A redefinição não está disponível no momento."
          : "El restablecimiento no está disponible en este momento."
      );
      return;
    }
    if (!sessionReady) {
      setErrorMessage(
        isPortuguese
          ? "Abra o link de recuperação mais recente enviado por e-mail antes de atualizar a senha."
          : "Abrí el enlace de recuperación más reciente enviado por correo antes de actualizar la contraseña."
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setErrorMessage(error.message);
      else {
        setMessage(
          isPortuguese
            ? "Senha atualizada. Agora você pode entrar com a nova senha."
            : "Contraseña actualizada. Ya podés ingresar con tu nueva contraseña."
        );
        setSessionReady(false);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isPortuguese
            ? "Não foi possível atualizar a senha."
            : "No se pudo actualizar la contraseña."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <section className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-xs sm:p-8">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FEF3E7] text-[#A65206]">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-[#24272B]">
          {isPortuguese ? "Criar nova senha" : "Crear nueva contraseña"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#565C64]">
          {isPortuguese
            ? "Escolha uma senha nova para voltar a acessar sua conta."
            : "Elegí una contraseña nueva para volver a acceder a tu cuenta."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-xs font-bold text-[#24272B]">
            {isPortuguese ? "Nova senha" : "Nueva contraseña"}
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#CFC6B8] bg-white px-3.5 text-sm font-normal focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/25"
            />
          </label>
          <label className="block text-xs font-bold text-[#24272B]">
            {isPortuguese ? "Confirmar nova senha" : "Confirmar nueva contraseña"}
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#CFC6B8] bg-white px-3.5 text-sm font-normal focus:border-[#F28C28] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/25"
            />
          </label>
          {!sessionReady && !errorMessage && (
            <p
              role="status"
              className="rounded-xl border border-[#DFD8CC] bg-[#F7F4EE] p-3 text-sm text-[#565C64]"
            >
              {isPortuguese
                ? "Validando o link de recuperação…"
                : "Validando el enlace de recuperación…"}
            </p>
          )}
          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-[#E5A49B] bg-[#FDF2F0] p-3 text-sm font-medium text-[#A62C1E]"
            >
              {errorMessage}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="rounded-xl border border-[#A7D7C2] bg-[#EAF5F0] p-3 text-sm font-medium text-[#15573B]"
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !sessionReady}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            {busy
              ? isPortuguese
                ? "Salvando…"
                : "Guardando…"
              : isPortuguese
                ? "Atualizar senha"
                : "Actualizar contraseña"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[#565C64]">
          <Link href="/entrar" className="font-bold text-[#A65206] hover:underline">
            {isPortuguese ? "Voltar para entrar" : "Volver al inicio de sesión"}
          </Link>
        </p>
      </section>
    </div>
  );
}
