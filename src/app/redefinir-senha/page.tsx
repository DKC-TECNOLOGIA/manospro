"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, LockKeyhole } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/services/supabase/client";

export default function ResetPasswordPage() {
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
      const authError = url.searchParams.get("error_description") ?? hashParams.get("error_description");
      const errorCode = url.searchParams.get("error_code") ?? hashParams.get("error_code");

      if (authError || errorCode) {
        if (!active) return;
        setErrorMessage(errorCode === "otp_expired"
          ? "Este link expirou ou já foi usado. Solicite uma nova redefinição de senha e abra o link mais recente."
          : "Não foi possível validar este link. Solicite uma nova redefinição de senha.");
        setSessionReady(false);
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setErrorMessage("Este link expirou ou já foi usado. Solicite uma nova redefinição de senha.");
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
        setErrorMessage("Não encontramos uma sessão de recuperação válida. Solicite um novo link para redefinir a senha.");
        setSessionReady(false);
      } else {
        setSessionReady(true);
      }
    };

    initializeRecovery().catch(() => {
      if (active) {
        setErrorMessage("Não foi possível validar o link. Solicite uma nova redefinição de senha.");
        setSessionReady(false);
      }
    });

    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    if (password.length < 8) {
      setErrorMessage("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setErrorMessage("As senhas informadas não são iguais.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setErrorMessage("A redefinição não está disponível no momento.");
      return;
    }
    if (!sessionReady) {
      setErrorMessage("Abra o link de recuperação mais recente enviado por e-mail antes de atualizar a senha.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setErrorMessage(error.message);
      else {
        setMessage("Senha atualizada. Agora você pode entrar com a nova senha.");
        setSessionReady(false);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível atualizar a senha.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <section className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-xs sm:p-8">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFF2DF] text-[#A75508]"><KeyRound className="h-5 w-5" /></span>
        <h1 className="mt-5 text-2xl font-extrabold text-[#24272B]">Criar nova senha</h1>
        <p className="mt-2 text-sm leading-6 text-[#626871]">Escolha uma senha nova para voltar a acessar sua conta.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-xs font-bold text-[#24272B]">Nova senha
            <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm font-normal focus:border-[#F28C28] focus:outline-none" />
          </label>
          <label className="block text-xs font-bold text-[#24272B]">Confirmar nova senha
            <input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3.5 text-sm font-normal focus:border-[#F28C28] focus:outline-none" />
          </label>
          {!sessionReady && !errorMessage && <p role="status" className="rounded-xl border border-[#DFD8CC] bg-[#F8F6F2] p-3 text-sm text-[#626871]">Validando o link de recuperação…</p>}
          {errorMessage && <p role="alert" className="rounded-xl border border-[#E5A49B] bg-[#FDF2F0] p-3 text-sm text-[#8C2318]">{errorMessage}</p>}
          {message && <p role="status" className="rounded-xl border border-[#A7D7C2] bg-[#EAF5F0] p-3 text-sm text-[#176041]">{message}</p>}
          <button type="submit" disabled={busy || !sessionReady} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 text-sm font-bold text-[#24272B] hover:bg-[#FF9B36] disabled:opacity-60"><LockKeyhole className="h-4 w-4" />{busy ? "Salvando…" : "Atualizar senha"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-[#626871]"><Link href="/entrar" className="font-bold text-[#A75508] hover:underline">Voltar para entrar</Link></p>
      </section>
    </main>
  );
}
