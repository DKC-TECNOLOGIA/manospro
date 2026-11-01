"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CircleUserRound, KeyRound, LoaderCircle, Mail, MapPin, Save, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { useLocale } from "@/features/i18n/LocaleContext";
import { REGION_CONFIGS } from "@/features/i18n/regions";
import { useAuth } from "@/features/auth/AuthProvider";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import type { CountryCode } from "@/types/domain";

interface AccountData {
  id: string;
  email: string;
  createdAt: string;
  profile: {
    id: string;
    fullName: string;
    phone: string;
    country: CountryCode;
    city: string;
    avatarUrl: string;
    createdAt: string;
  } | null;
  profileLoadFailed: boolean;
}

type Feedback = { type: "success" | "error"; message: string } | null;

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(25).refine((value) => !value || /^[+\d().\s-]+$/.test(value)),
  country: z.enum(["AR", "BR"]),
  city: z.string().trim().min(2).max(120),
  avatarUrl: z.string().trim().max(2048).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:";
    } catch {
      return false;
    }
  }),
});

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  const success = feedback.type === "success";
  return (
    <p
      role={success ? "status" : "alert"}
      className={`rounded-xl border px-3.5 py-3 text-sm ${success
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {feedback.message}
    </p>
  );
}

export function AccountSettings({ account }: { account: AccountData }) {
  const { locale, setCountry: saveCountryPreference } = useLocale();
  const { accountHref, isAdmin } = useAuth();
  const router = useRouter();
  const isPortuguese = locale === "pt-BR";
  const { profile } = account;
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [country, setCountry] = useState<CountryCode>(profile?.country ?? "AR");
  const [city, setCity] = useState(profile?.city ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [email, setEmail] = useState(account.email);
  const [newEmail, setNewEmail] = useState(account.email);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);
  const [securityFeedback, setSecurityFeedback] = useState<Feedback>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const copy = isPortuguese
    ? {
        title: "Minha conta",
        subtitle: "Gerencie seus dados pessoais e as preferências de acesso.",
        memberSince: "Conta criada em",
        profile: "Perfil pessoal",
        profileHelp: "Mantenha seus dados atualizados para facilitar o contato.",
        fullName: "Nome completo",
        phone: "Telefone",
        country: "País",
        city: "Cidade",
        avatar: "Link da foto de perfil (opcional)",
        avatarHelp: "Use um endereço de imagem HTTPS. O envio de arquivo não está habilitado nesta conta.",
        save: "Salvar perfil",
        saving: "Salvando…",
        emailSettings: "Configurações de e-mail",
        emailHelp: "A alteração pode exigir confirmação enviada pelo Supabase Auth.",
        currentEmail: "E-mail atual",
        newEmail: "Novo e-mail",
        updateEmail: "Atualizar e-mail",
        security: "Segurança",
        securityHelp: "A senha é gerenciada com segurança pelo Supabase Auth.",
        resetPassword: "Enviar link para redefinir senha",
        accountHome: "Área da plataforma",
        edit: "Editar perfil",
        settings: "Configurações",
        securityNav: "Segurança",
        created: "Perfil atualizado com sucesso.",
        failed: "Não foi possível salvar. Confira os dados e tente novamente.",
        invalid: "Revise nome, telefone, país, cidade e link da foto.",
        emailInvalid: "Informe um e-mail válido.",
        emailSent: "Se a alteração for permitida, você receberá a confirmação no e-mail informado.",
        emailFailed: "Não foi possível iniciar a alteração do e-mail.",
        resetSent: "Se houver uma conta associada, o link de redefinição chegará por e-mail.",
        resetFailed: "Não foi possível solicitar a redefinição agora.",
        profileMissing: "Não foi possível carregar o perfil. Atualize a página ou entre novamente.",
        internationalCode: "Inclua o código internacional no telefone",
        argentina: "Argentina",
        brazil: "Brasil",
      }
    : {
        title: "Mi cuenta",
        subtitle: "Administrá tus datos personales y preferencias de acceso.",
        memberSince: "Cuenta creada el",
        profile: "Perfil personal",
        profileHelp: "Mantené tus datos actualizados para facilitar el contacto.",
        fullName: "Nombre completo",
        phone: "Teléfono",
        country: "País",
        city: "Ciudad",
        avatar: "Enlace de foto de perfil (opcional)",
        avatarHelp: "Usá una URL HTTPS de imagen. La carga de archivos no está habilitada para esta cuenta.",
        save: "Guardar perfil",
        saving: "Guardando…",
        emailSettings: "Configuración del correo",
        emailHelp: "El cambio puede requerir confirmación enviada por Supabase Auth.",
        currentEmail: "Correo actual",
        newEmail: "Correo nuevo",
        updateEmail: "Actualizar correo",
        security: "Seguridad",
        securityHelp: "La contraseña se gestiona de forma segura con Supabase Auth.",
        resetPassword: "Enviar enlace para restablecer contraseña",
        accountHome: "Área de la plataforma",
        edit: "Editar perfil",
        settings: "Configuración",
        securityNav: "Seguridad",
        created: "Perfil actualizado correctamente.",
        failed: "No se pudo guardar. Revisá los datos e intentá de nuevo.",
        invalid: "Revisá nombre, teléfono, país, ciudad y enlace de la foto.",
        emailInvalid: "Ingresá un correo válido.",
        emailSent: "Si el cambio está habilitado, recibirás la confirmación en el correo indicado.",
        emailFailed: "No se pudo iniciar el cambio de correo.",
        resetSent: "Si existe una cuenta asociada, recibirás el enlace de restablecimiento por correo.",
        resetFailed: "No se pudo solicitar el restablecimiento ahora.",
        profileMissing: "No se pudo cargar el perfil. Actualizá la página o volvé a ingresar.",
        internationalCode: "Incluí el código internacional en el teléfono",
        argentina: "Argentina",
        brazil: "Brasil",
      };

  const formatCreatedAt = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileFeedback(null);
    const parsed = profileSchema.safeParse({ fullName, phone, country, city, avatarUrl });
    if (!parsed.success) {
      setProfileFeedback({ type: "error", message: copy.invalid });
      return;
    }
    if (!profile) {
      setProfileFeedback({ type: "error", message: copy.profileMissing });
      return;
    }

    setIsSavingProfile(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== account.id || user.id !== profile.id) {
        router.replace("/entrar?next=%2Fconta");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: parsed.data.fullName,
          phone: parsed.data.phone || null,
          country: parsed.data.country,
          city: parsed.data.city,
          avatar_url: parsed.data.avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();
      if (error || !data) throw error ?? new Error("profile_update_not_applied");

      saveCountryPreference(parsed.data.country);
      setProfileFeedback({ type: "success", message: copy.created });
      router.refresh();
    } catch {
      setProfileFeedback({ type: "error", message: copy.failed });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleEmailSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailFeedback(null);
    const requestedEmail = newEmail.trim().toLowerCase();
    if (!z.email().safeParse(requestedEmail).success) {
      setEmailFeedback({ type: "error", message: copy.emailInvalid });
      return;
    }
    if (requestedEmail === email.trim().toLowerCase()) return;

    setIsSavingEmail(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== account.id) throw new Error("session_not_found");
      const { data, error } = await supabase.auth.updateUser({ email: requestedEmail });
      if (error) throw error;
      if (data.user?.email?.toLowerCase() === requestedEmail) setEmail(requestedEmail);
      setEmailFeedback({ type: "success", message: copy.emailSent });
    } catch {
      setEmailFeedback({ type: "error", message: copy.emailFailed });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordReset = async () => {
    setSecurityFeedback(null);
    if (!email) {
      setSecurityFeedback({ type: "error", message: copy.resetFailed });
      return;
    }
    setIsSendingReset(true);
    try {
      const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      setSecurityFeedback({ type: "success", message: copy.resetSent });
    } catch {
      setSecurityFeedback({ type: "error", message: copy.resetFailed });
    } finally {
      setIsSendingReset(false);
    }
  };

  const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-[#D8D0C2] bg-white px-3.5 text-sm text-[#24272B] outline-none transition focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/20";
  const labelClass = "block text-sm font-semibold text-[#343A40]";
  const cardClass = "scroll-mt-28 rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-xs sm:p-7";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-[#DFD8CC] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#C86D14]">ManosPro</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#24272B]">{copy.title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#565C64]">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#565C64]">
          <CalendarDays className="h-4 w-4 text-[#C86D14]" aria-hidden="true" />
          <span>{copy.memberSince} {formatCreatedAt(account.createdAt)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-[#DFD8CC] bg-[#EFEAE1] p-3 lg:sticky lg:top-24">
          <nav aria-label={isPortuguese ? "Navegação da conta" : "Navegación de la cuenta"} className="flex gap-2 overflow-x-auto lg:flex-col">
            <a href="#perfil" className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#343A40] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">{copy.edit}</a>
            <a href="#configuracoes" className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#343A40] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">{copy.settings}</a>
            <a href="#seguranca" className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#343A40] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">{copy.securityNav}</a>
          </nav>
          <Link href={accountHref ?? "/"} className="mt-3 hidden items-center gap-2 border-t border-[#D8D0C2] px-3 pt-4 text-xs font-semibold text-[#565C64] hover:text-[#C86D14] lg:flex">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {isAdmin ? (isPortuguese ? "Painel administrativo" : "Panel de administración") : copy.accountHome}
          </Link>
        </aside>

        <div className="min-w-0 space-y-5">
          {(account.profileLoadFailed || !profile) && <FeedbackMessage feedback={{ type: "error", message: copy.profileMissing }} />}

          <section id="perfil" className={cardClass}>
            <div className="mb-6 flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFF1DF] text-[#B85A00]"><CircleUserRound className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h2 className="text-xl font-bold text-[#24272B]">{copy.profile}</h2>
                <p className="mt-1 text-sm text-[#565C64]">{copy.profileHelp}</p>
              </div>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>{copy.fullName} <span className="text-[#C86D14]">*</span>
                  <input className={inputClass} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required maxLength={100} />
                </label>
                <label className={labelClass}>{copy.country} <span className="text-[#C86D14]">*</span>
                  <select className={inputClass} value={country} onChange={(event) => setCountry(event.target.value as CountryCode)}>
                    <option value="AR">{copy.argentina}</option>
                    <option value="BR">{copy.brazil}</option>
                  </select>
                </label>
                <label className={labelClass}>{copy.city} <span className="text-[#C86D14]">*</span>
                  <input className={inputClass} value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" required maxLength={120} />
                </label>
                <label className={labelClass}>{copy.phone}
                  <input className={inputClass} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder={REGION_CONFIGS[country].phonePlaceholder} maxLength={25} aria-describedby="account-phone-hint" />
                  <span id="account-phone-hint" className="mt-1 block text-xs font-normal text-[#666C75]">{copy.internationalCode}: {REGION_CONFIGS[country].phonePrefix}</span>
                </label>
              </div>
              <label className={labelClass}>{copy.avatar}
                <input className={inputClass} type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://" maxLength={2048} />
                <span className="mt-1 block text-xs font-normal text-[#666C75]">{copy.avatarHelp}</span>
              </label>
              <FeedbackMessage feedback={profileFeedback} />
              <button type="submit" disabled={isSavingProfile || !profile} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 text-sm font-bold text-[#1B1E22] transition-colors hover:bg-[#DF7B18] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24272B]">
                {isSavingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                {isSavingProfile ? copy.saving : copy.save}
              </button>
            </form>
          </section>

          <section id="configuracoes" className={cardClass}>
            <div className="mb-5 flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFF1DF] text-[#B85A00]"><Mail className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h2 className="text-xl font-bold text-[#24272B]">{copy.emailSettings}</h2>
                <p className="mt-1 text-sm text-[#565C64]">{copy.emailHelp}</p>
              </div>
            </div>
            <form onSubmit={handleEmailSave} className="space-y-4">
              <label className={labelClass}>{copy.currentEmail}
                <input className={`${inputClass} bg-[#F7F4EE]`} value={email} readOnly autoComplete="email" />
              </label>
              <label className={labelClass}>{copy.newEmail}
                <input className={inputClass} type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} autoComplete="email" required />
              </label>
              <FeedbackMessage feedback={emailFeedback} />
              <button type="submit" disabled={isSavingEmail} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0C2] bg-white px-5 text-sm font-bold text-[#24272B] transition-colors hover:bg-[#F7F4EE] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
                {isSavingEmail && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {copy.updateEmail}
              </button>
            </form>
          </section>

          <section id="seguranca" className={cardClass}>
            <div className="mb-5 flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E7F2EC] text-[#176043]"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h2 className="text-xl font-bold text-[#24272B]">{copy.security}</h2>
                <p className="mt-1 text-sm text-[#565C64]">{copy.securityHelp}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-sm text-[#565C64]">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#176043]" aria-hidden="true" />
                <span>{email}</span>
              </div>
              <button type="button" onClick={() => void handlePasswordReset()} disabled={isSendingReset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0C2] bg-white px-4 text-sm font-semibold text-[#24272B] transition-colors hover:bg-[#F7F4EE] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
                {isSendingReset ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
                {copy.resetPassword}
              </button>
            </div>
            <div className="mt-4"><FeedbackMessage feedback={securityFeedback} /></div>
          </section>
        </div>
      </div>
    </main>
  );
}
