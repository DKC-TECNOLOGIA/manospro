"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck,
  BriefcaseBusiness, Check, CircleDollarSign, ClipboardList,
  Clock3, LayoutDashboard, LogOut, Search, Shield, ShieldCheck, Tags,
  Users, UserRound, UserMinus, UserPlus, X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/services/supabase/client";

type Metrics = {
  totalUsers: number; totalClients: number; totalProfessionals: number;
  totalAdmins: number; activeAccounts: number; suspendedAccounts: number;
  newUsersThisMonth: number; signupsLast7Days: number; signupsLast30Days: number;
  arAccounts: number; brAccounts: number; publishedProfessionals: number;
  draftProfessionals: number; pendingVerifications: number; verifiedProfessionals: number;
  totalQuoteRequests: number; totalDirectChats: number; pendingReports: number;
  resolvedReports: number; revenue: number | null; premiumUsers: number | null;
  activeSubscriptions: number | null; cancelledSubscriptions: number | null;
};

type AdminUser = {
  id: string; role: "client" | "professional" | "admin"; full_name: string;
  email: string; country: "AR" | "BR"; city: string; is_suspended: boolean;
  created_at: string; phone: string | null; avatar_url: string | null;
};

type Category = {
  id: string; slug: string; icon_name: string; name_es_ar: string; name_pt_br: string;
  description_es_ar: string; description_pt_br: string; examples_es_ar: string[];
  examples_pt_br: string[]; display_order: number; is_active: boolean;
};

type Report = {
  id: string; reporter_id: string; target_type: string; target_user_id: string | null;
  target_entity_id: string | null; reason: string; details: string; status: string;
  resolution_note: string | null; resolved_by: string | null; resolved_at: string | null;
  created_at: string;
};

type Verification = {
  user_id: string; slug: string; verification_status: string; matricula_note: string | null;
  created_at: string; profiles: { full_name: string; country: string; city: string } | { full_name: string; country: string; city: string }[] | null;
};

type AuditItem = {
  id: string; action_type: string; target_type: string; target_id: string;
  summary: string; created_at: string;
};

type AdminMember = {
  user_id: string; email: string; full_name: string;
  role: "owner" | "admin" | "moderator"; granted_at: string;
};

export type AdminPanelData = {
  adminName: string; metrics: Metrics | null; users: AdminUser[]; userCount: number;
  categories: Category[]; reports: Report[]; verifications: Verification[];
  activity: AuditItem[]; loadErrors: string[];
  adminMembers: AdminMember[]; canManageAdmins: boolean;
};

type View = "overview" | "users" | "verifications" | "reports" | "categories" | "activity" | "administrators";

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "users", label: "Usuários", icon: Users },
  { id: "verifications", label: "Verificações", icon: BadgeCheck },
  { id: "reports", label: "Denúncias", icon: AlertTriangle },
  { id: "categories", label: "Categorias", icon: Tags },
  { id: "activity", label: "Auditoria", icon: Activity },
  { id: "administrators", label: "Administradores", icon: ShieldCheck },
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#CFC8BD] bg-[#FBF9F5] px-6 py-12 text-center">
      <ClipboardList className="mx-auto h-8 w-8 text-[#8A8F96]" aria-hidden="true" />
      <h3 className="mt-3 font-bold text-[#24272B]">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#626871]">{detail}</p>
    </div>
  );
}

export function AdminPanel({ initialData }: { initialData: AdminPanelData }) {
  const router = useRouter();
  const [view, setView] = useState<View>("overview");
  const [users, setUsers] = useState(initialData.users);
  const [userCount, setUserCount] = useState(initialData.userCount);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const metrics = initialData.metrics;

  const pendingReports = useMemo(
    () => initialData.reports.filter((report) => report.status === "pending"),
    [initialData.reports]
  );
  const pendingVerifications = initialData.verifications;

  const changeView = (next: View) => {
    setView(next);
    setFeedback(null);
    setSelectedUser(null);
  };

  const reportError = (message: string) => {
    setFeedback({ tone: "error", text: message });
  };

  const runAction = async (key: string, action: () => Promise<void>, success: string) => {
    setBusy(key);
    setFeedback(null);
    try {
      await action();
      setFeedback({ tone: "success", text: success });
      startTransition(() => router.refresh());
    } catch (error) {
      reportError(error instanceof Error ? error.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(null);
    }
  };

  const loadUsers = async (nextPage = 1) => {
    setBusy("search");
    setFeedback(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc("admin_list_users", {
      p_search: search.trim(), p_status: status, p_page: nextPage, p_page_size: 20,
    });
    if (error) reportError(error.message);
    else {
      const result = data as { users: AdminUser[]; totalCount: number };
      setUsers(result.users);
      setUserCount(result.totalCount);
      setPage(nextPage);
      setSelectedUser(null);
    }
    setBusy(null);
  };

  const moderateUser = (user: AdminUser) => {
    const action = user.is_suspended ? "reativar" : "suspender";
    const reason = window.prompt(`Informe o motivo para ${action} esta conta (mínimo 5 caracteres):`);
    if (!reason || reason.trim().length < 5) return;
    if (!window.confirm(`Confirmar ${action} a conta de ${user.full_name}?`)) return;
    void runAction(`user-${user.id}`, async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_moderate_user_suspension", {
        target_user_id: user.id, suspend: !user.is_suspended, reason: reason.trim(),
      });
      if (error) throw error;
      await loadUsers(page);
    }, `Conta ${user.is_suspended ? "reativada" : "suspensa"} e operação registrada na auditoria.`);
  };

  const decideVerification = (request: Verification, approve: boolean) => {
    const person = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
    const note = window.prompt(approve
      ? "Descreva o documento ou critério conferido (mínimo 5 caracteres):"
      : "Registre o motivo para não aprovar a verificação (mínimo 5 caracteres):");
    if (!note || note.trim().length < 5) return;
    const action = approve ? "aprovar" : "recusar";
    if (!window.confirm(`Confirmar ${action} a verificação de ${person?.full_name ?? "este profissional"}?`)) return;
    void runAction(`verify-${request.user_id}`, async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_decide_professional_verification", {
        target_user_id: request.user_id,
        new_status: approve ? "verified" : "unverified",
        decision_note: note.trim(),
      });
      if (error) throw error;
    }, `Verificação ${approve ? "aprovada" : "recusada"} e decisão auditada.`);
  };

  const resolveReport = (report: Report, resolution: "resolved" | "dismissed") => {
    const note = window.prompt("Registre o resultado da análise (mínimo 5 caracteres):");
    if (!note || note.trim().length < 5) return;
    if (!window.confirm(`Confirmar ${resolution === "resolved" ? "resolução" : "arquivamento"} da denúncia?`)) return;
    void runAction(`report-${report.id}`, async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_resolve_moderation_report", {
        report_id: report.id, new_status: resolution, resolution_note: note.trim(), suspend_reported_user: false,
      });
      if (error) throw error;
    }, `Denúncia ${resolution === "resolved" ? "resolvida" : "arquivada"} e decisão auditada.`);
  };

  const toggleCategory = (category: Category) => {
    if (!window.confirm(`${category.is_active ? "Desativar" : "Ativar"} a categoria “${category.name_pt_br}”?`)) return;
    void runAction(`category-${category.id}`, async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_save_category", {
        p_slug: category.slug, p_icon_name: category.icon_name,
        p_name_es_ar: category.name_es_ar, p_name_pt_br: category.name_pt_br,
        p_description_es_ar: category.description_es_ar, p_description_pt_br: category.description_pt_br,
        p_examples_es_ar: category.examples_es_ar, p_examples_pt_br: category.examples_pt_br,
        p_display_order: category.display_order, p_is_active: !category.is_active,
      });
      if (error) throw error;
    }, `Categoria ${category.is_active ? "desativada" : "ativada"}.`);
  };

  const grantAdmin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = adminEmail.trim().toLowerCase();
    if (!email) return;
    if (!window.confirm(`Conceder acesso administrativo à conta ${email}? A conta precisa estar cadastrada no ManosPro.`)) return;
    void runAction("admin-grant", async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_grant_membership", { target_email: email });
      if (error) throw error;
      setAdminEmail("");
    }, `Acesso administrativo concedido a ${email}.`);
  };

  const revokeAdmin = (member: AdminMember) => {
    if (member.role === "owner") return;
    if (!window.confirm(`Remover o acesso administrativo de ${member.full_name} (${member.email})? A conta e os dados dela permanecerão intactos.`)) return;
    void runAction(`admin-revoke-${member.user_id}`, async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_revoke_membership", { target_user_id: member.user_id });
      if (error) throw error;
    }, `Acesso administrativo removido de ${member.email}.`);
  };

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/entrar");
    router.refresh();
  };

  const title = navItems.find((item) => item.id === view)?.label ?? "Administração";

  return (
    <div className="min-h-[calc(100vh-5.5rem)] bg-[#F0EEE9]">
      <div className="mx-auto max-w-[1540px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8">
          <aside className="h-fit rounded-[1.4rem] bg-[#24272B] p-4 text-[#F7F4EE] lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-2 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F28C28] text-[#24272B]">
                  <Shield className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold leading-tight">ManosPro</p>
                  <p className="mt-1 truncate text-xs text-[#B9B3A9]">{initialData.adminName}</p>
                </div>
              </div>
              <span className="rounded-full border border-[#F28C28]/40 px-2 py-1 text-[10px] font-bold text-[#FFB15B]">ADMIN</span>
            </div>

            <nav aria-label="Navegação administrativa" className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => changeView(id)} aria-current={view === id ? "page" : undefined}
                  className={`flex min-h-10 shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] ${view === id ? "bg-[#373B40] text-white" : "text-[#D2CEC7] hover:bg-white/8 hover:text-white"}`}>
                  <Icon className="h-4 w-4 text-[#F28C28]" aria-hidden="true" />
                  {label}
                  {id === "reports" && pendingReports.length > 0 && <span className="ml-auto rounded-full bg-[#B93829] px-2 py-0.5 text-[10px] text-white">{pendingReports.length}</span>}
                  {id === "verifications" && pendingVerifications.length > 0 && <span className="ml-auto rounded-full bg-[#B66A16] px-2 py-0.5 text-[10px] text-white">{pendingVerifications.length}</span>}
                </button>
              ))}
            </nav>

            <button type="button" onClick={signOut} className="mt-5 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#D2CEC7] transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sair do painel
            </button>
          </aside>

          <main className="min-w-0">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#B66A16]">Administração da plataforma</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#24272B] sm:text-4xl">{title}</h1>
                <p className="mt-2 text-sm text-[#626871]">Operações reais, protegidas por sessão e autorização no Supabase.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#D8D1C6] bg-[#F8F6F1] px-3 py-2 text-xs font-semibold text-[#42474F]">
                <span className="h-2 w-2 rounded-full bg-[#16805D]" /> Conexão autenticada
              </div>
            </header>

            {initialData.loadErrors.length > 0 && (
              <div role="alert" className="mb-5 rounded-xl border border-[#E5A49B] bg-[#FDF2F0] p-4 text-sm text-[#8C2318]">
                Não foi possível carregar: {initialData.loadErrors.join(", ")}. Atualize a página ou confira as migrations aplicadas.
              </div>
            )}
            {feedback && (
              <div role={feedback.tone === "error" ? "alert" : "status"} className={`mb-5 flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${feedback.tone === "error" ? "border-[#E5A49B] bg-[#FDF2F0] text-[#8C2318]" : "border-[#A7D9C4] bg-[#EDF8F2] text-[#145B40]"}`}>
                <span>{feedback.text}</span>
                <button type="button" onClick={() => setFeedback(null)} aria-label="Fechar aviso"><X className="h-4 w-4" /></button>
              </div>
            )}

            {view === "overview" && <Overview metrics={metrics} users={initialData.users} activity={initialData.activity} onOpenUsers={() => changeView("users")} />}
            {view === "users" && (
              <section className="space-y-4">
                <div className="rounded-2xl border border-[#DDD7CC] bg-white p-4 sm:p-5">
                  <form onSubmit={(event) => { event.preventDefault(); void loadUsers(1); }} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
                    <label className="relative block">
                      <span className="sr-only">Pesquisar nome ou e-mail</span>
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#767C83]" aria-hidden="true" />
                      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar nome ou e-mail" className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white pr-3 pl-10 text-sm outline-none focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/25" />
                    </label>
                    <label>
                      <span className="sr-only">Filtrar situação da conta</span>
                      <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm outline-none focus:border-[#F28C28]">
                        <option value="all">Todas as situações</option><option value="active">Ativas</option><option value="suspended">Suspensas</option>
                      </select>
                    </label>
                    <button type="submit" disabled={busy === "search"} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 text-sm font-bold text-[#24272B] hover:bg-[#FF9B36] disabled:opacity-60"><Search className="h-4 w-4" /> Pesquisar</button>
                  </form>
                  <p className="mt-3 text-xs text-[#747A81]">{userCount} {userCount === 1 ? "conta" : "contas"} encontradas. E-mails visíveis somente para administradores autorizados.</p>
                </div>
                {users.length === 0 ? <EmptyState title="Nenhuma conta encontrada" detail="Tente outro nome, e-mail ou filtro de situação." /> : (
                  <div className="overflow-hidden rounded-2xl border border-[#DDD7CC] bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-[#F7F4EE] text-xs uppercase tracking-wide text-[#666C74]"><tr><th className="px-5 py-3">Conta</th><th className="px-5 py-3">Perfil</th><th className="px-5 py-3">Localização</th><th className="px-5 py-3">Cadastro</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3"><span className="sr-only">Ações</span></th></tr></thead>
                        <tbody className="divide-y divide-[#EEE9E0]">
                          {users.map((user) => <tr key={user.id} className="hover:bg-[#FBF9F5]">
                            <td className="px-5 py-4"><button type="button" onClick={() => setSelectedUser(user)} className="text-left font-bold text-[#24272B] hover:underline">{user.full_name}</button><p className="mt-0.5 text-xs text-[#747A81]">{user.email}</p></td>
                            <td className="px-5 py-4 capitalize text-[#42474F]">{user.role === "professional" ? "Profissional" : user.role === "admin" ? "Admin" : "Cliente"}</td>
                            <td className="px-5 py-4 text-[#42474F]">{user.city}, {user.country}</td>
                            <td className="px-5 py-4 text-xs text-[#626871]">{new Date(user.created_at).toLocaleDateString("pt-BR")}</td>
                            <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_suspended ? "bg-[#FCE9E6] text-[#9F2D20]" : "bg-[#E8F5EE] text-[#146344]"}`}>{user.is_suspended ? "Suspensa" : "Ativa"}</span></td>
                            <td className="px-5 py-4 text-right"><button type="button" disabled={busy === `user-${user.id}`} onClick={() => moderateUser(user)} className="rounded-lg border border-[#D8D1C6] px-3 py-2 text-xs font-bold text-[#42474F] hover:border-[#B93829] hover:text-[#9F2D20] disabled:opacity-50">{user.is_suspended ? "Reativar" : "Suspender"}</button></td>
                          </tr>)}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#EEE9E0] px-5 py-3 text-xs text-[#626871]">
                      <span>Página {page} de {Math.max(1, Math.ceil(userCount / 20))}</span>
                      <div className="flex gap-2"><button type="button" disabled={page <= 1 || busy === "search"} onClick={() => void loadUsers(page - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#D8D1C6] disabled:opacity-40" aria-label="Página anterior"><ArrowLeft className="h-4 w-4" /></button><button type="button" disabled={page >= Math.ceil(userCount / 20) || busy === "search"} onClick={() => void loadUsers(page + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#D8D1C6] disabled:opacity-40" aria-label="Próxima página"><ArrowRight className="h-4 w-4" /></button></div>
                    </div>
                  </div>
                )}
                {selectedUser && <UserDetails user={selectedUser} onClose={() => setSelectedUser(null)} />}
              </section>
            )}
            {view === "verifications" && <VerificationQueue requests={pendingVerifications} busy={busy} onDecide={decideVerification} />}
            {view === "reports" && <ReportQueue reports={pendingReports} busy={busy} onResolve={resolveReport} />}
            {view === "categories" && <CategoryList categories={initialData.categories} busy={busy} onToggle={toggleCategory} />}
            {view === "activity" && <ActivityList items={initialData.activity} />}
            {view === "administrators" && (
              <AdminManagement
                members={initialData.adminMembers}
                canManage={initialData.canManageAdmins}
                email={adminEmail}
                onEmailChange={setAdminEmail}
                onGrant={grantAdmin}
                onRevoke={revokeAdmin}
                busy={busy}
              />
            )}

            <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[#747A81]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#16805D]" aria-hidden="true" /> Cada ação de moderação, categoria ou verificação é validada no banco e registrada na trilha de auditoria.</p>
            {isPending && <span className="sr-only" role="status">Atualizando informações do painel</span>}
          </main>
        </div>
      </div>
    </div>
  );
}

function AdminManagement({ members, canManage, email, onEmailChange, onGrant, onRevoke, busy }: {
  members: AdminMember[]; canManage: boolean; email: string;
  onEmailChange: (email: string) => void; onGrant: (event: React.FormEvent<HTMLFormElement>) => void;
  onRevoke: (member: AdminMember) => void; busy: string | null;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#DDD7CC] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF2DF] text-[#A75508]"><UserPlus className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 className="font-bold text-[#24272B]">Conceder acesso administrativo</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#626871]">Informe o e-mail de uma conta já cadastrada no ManosPro. O acesso será registrado na auditoria, sem alterar ou excluir o perfil.</p></div>
        </div>
        {canManage ? (
          <form onSubmit={onGrant} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#42474F]">E-mail da conta</span><input required type="email" autoComplete="off" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="nome@exemplo.com" className="h-11 w-full rounded-xl border border-[#D4CCC0] px-3.5 text-sm outline-none focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/20" /></label>
            <button type="submit" disabled={busy === "admin-grant" || !email.trim()} className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 text-sm font-bold text-[#24272B] hover:bg-[#FF9B36] disabled:opacity-50"><UserPlus className="h-4 w-4" />{busy === "admin-grant" ? "Concedendo…" : "Adicionar administrador"}</button>
          </form>
        ) : <p className="mt-5 rounded-xl bg-[#F7F4EE] p-3 text-sm text-[#626871]">Somente o owner pode conceder ou remover acessos administrativos.</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#DDD7CC] bg-white">
        <div className="border-b border-[#EEE9E0] px-5 py-4 sm:px-6"><h2 className="font-bold text-[#24272B]">Acessos atuais</h2><p className="mt-1 text-xs text-[#747A81]">{members.length} {members.length === 1 ? "administrador" : "administradores"} com acesso ao painel</p></div>
        {members.length === 0 ? <EmptyState title="Nenhum acesso administrativo" detail="Os acessos concedidos aparecerão nesta lista." /> : (
          <ul className="divide-y divide-[#EEE9E0]">
            {members.map((member) => <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${member.role === "owner" ? "bg-[#FFF2DF] text-[#A75508]" : "bg-[#E8F5EE] text-[#176041]"}`}><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-[#24272B]">{member.full_name}</p><p className="truncate text-xs text-[#747A81]">{member.email}</p></div></div>
              <div className="flex items-center gap-3"><span className="rounded-full bg-[#F7F4EE] px-3 py-1 text-xs font-bold capitalize text-[#42474F]">{member.role === "owner" ? "Owner" : member.role === "moderator" ? "Moderador" : "Administrador"}</span>{canManage && member.role !== "owner" && <button type="button" disabled={busy === `admin-revoke-${member.user_id}`} onClick={() => onRevoke(member)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E6C3BD] px-3 text-xs font-bold text-[#9F2D20] hover:bg-[#FDF2F0] disabled:opacity-50"><UserMinus className="h-4 w-4" />Remover acesso</button>}</div>
            </li>)}
          </ul>
        )}
      </div>
    </section>
  );
}

function Overview({ metrics, users, activity, onOpenUsers }: { metrics: Metrics | null; users: AdminUser[]; activity: AuditItem[]; onOpenUsers: () => void }) {
  if (!metrics) return <EmptyState title="Indicadores indisponíveis" detail="A função de métricas não respondeu. Confira a conexão e as migrations do painel." />;
  const stats = [
    { label: "Contas ativas", value: metrics.activeAccounts, note: `${metrics.suspendedAccounts} suspensas`, icon: Users },
    { label: "Profissionais publicados", value: metrics.publishedProfessionals, note: `${metrics.draftProfessionals} em rascunho`, icon: BriefcaseBusiness },
    { label: "Verificações pendentes", value: metrics.pendingVerifications, note: `${metrics.verifiedProfessionals} verificadas`, icon: BadgeCheck },
    { label: "Solicitações de orçamento", value: metrics.totalQuoteRequests, note: `${metrics.totalDirectChats} conversas diretas`, icon: ClipboardList },
  ];
  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#24272B] p-6 text-[#F7F4EE] sm:p-8">
          <div className="absolute -right-10 -bottom-20 h-64 w-64 rounded-full border-[38px] border-[#F28C28]/15" aria-hidden="true" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div><p className="text-sm font-semibold text-[#FFB15B]">Usuários cadastrados</p><p className="mt-2 text-5xl font-extrabold tracking-tight">{metrics.totalUsers.toLocaleString("pt-BR")}</p><p className="mt-3 text-sm text-[#C7C2B8]">{metrics.totalClients} clientes · {metrics.totalProfessionals} profissionais · {metrics.totalAdmins} admins</p></div>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3"><p className="text-xs text-[#C7C2B8]">Novos neste mês</p><p className="mt-1 text-2xl font-bold text-white">{metrics.newUsersThisMonth}</p></div>
          </div>
          <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-[#D1CCC3]"><span>Brasil: {metrics.brAccounts}</span><span>Argentina: {metrics.arAccounts}</span><span>Últimos 7 dias: {metrics.signupsLast7Days}</span><span>Últimos 30 dias: {metrics.signupsLast30Days}</span></div>
        </div>
        <div className="rounded-[1.5rem] border border-[#DDD7CC] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-[#24272B]">Planos e faturamento</p><p className="mt-1 text-xs text-[#747A81]">Dados comerciais da plataforma</p></div><CircleDollarSign className="h-5 w-5 text-[#B66A16]" /></div>
          <p className="mt-6 text-lg font-bold text-[#42474F]">Sem integração financeira</p><p className="mt-1 max-w-md text-sm leading-6 text-[#747A81]">O banco ainda não tem assinaturas, pagamentos ou planos premium. Indicadores de receita não são exibidos até a integração de um provedor.</p>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#F7F4EE] px-3 py-2.5 text-xs text-[#626871]"><ShieldCheck className="h-4 w-4 text-[#16805D]" /> Nenhum pagamento é simulado ou marcado como quitado.</div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }) => <article key={label} className="rounded-2xl border border-[#DDD7CC] bg-white p-5"><div className="flex items-start justify-between"><p className="text-xs font-semibold text-[#626871]">{label}</p><Icon className="h-4 w-4 text-[#B66A16]" aria-hidden="true" /></div><p className="mt-4 text-3xl font-extrabold tracking-tight text-[#24272B]">{value.toLocaleString("pt-BR")}</p><p className="mt-1 text-xs text-[#747A81]">{note}</p></article>)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-[#DDD7CC] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-[#24272B]">Cadastros recentes</h2><p className="mt-1 text-xs text-[#747A81]">Contas ordenadas pela data real de cadastro</p></div><button type="button" onClick={onOpenUsers} className="text-xs font-bold text-[#A75508] hover:underline">Ver usuários</button></div>
          {users.length === 0 ? <p className="py-8 text-center text-sm text-[#747A81]">Ainda não há contas cadastradas.</p> : <div className="mt-4 divide-y divide-[#EEE9E0]">{users.slice(0, 5).map((user) => <div key={user.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#24272B]">{user.full_name}</p><p className="truncate text-xs text-[#747A81]">{user.email}</p></div><span className="shrink-0 text-xs text-[#747A81]">{new Date(user.created_at).toLocaleDateString("pt-BR")}</span></div>)}</div>}
        </div>
        <div className="rounded-2xl border border-[#DDD7CC] bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#B66A16]" /><div><h2 className="font-bold text-[#24272B]">Atividade administrativa</h2><p className="mt-1 text-xs text-[#747A81]">Alterações registradas no banco</p></div></div>{activity.length === 0 ? <p className="py-8 text-center text-sm text-[#747A81]">Nenhuma operação administrativa registrada.</p> : <div className="mt-4 divide-y divide-[#EEE9E0]">{activity.slice(0, 5).map((item) => <div key={item.id} className="py-3"><p className="text-sm font-semibold text-[#42474F]">{item.summary}</p><p className="mt-1 text-xs text-[#747A81]">{dateLabel(item.created_at)}</p></div>)}</div>}</div>
      </section>
    </div>
  );
}

function UserDetails({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return <aside aria-label={`Detalhes de ${user.full_name}`} className="rounded-2xl border border-[#D8D1C6] bg-[#FBF9F5] p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8E3D9]"><UserRound className="h-5 w-5 text-[#42474F]" /></span><div><h2 className="font-bold text-[#24272B]">{user.full_name}</h2><p className="text-sm text-[#626871]">{user.email}</p></div></div><button type="button" onClick={onClose} aria-label="Fechar detalhes" className="rounded-lg p-2 hover:bg-[#EEE9E0]"><X className="h-4 w-4" /></button></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#747A81]">Tipo de conta</dt><dd className="mt-1 font-semibold text-[#42474F]">{user.role === "professional" ? "Profissional" : "Cliente"}</dd></div><div><dt className="text-xs text-[#747A81]">Situação</dt><dd className="mt-1 font-semibold text-[#42474F]">{user.is_suspended ? "Suspensa" : "Ativa"}</dd></div><div><dt className="text-xs text-[#747A81]">Localização</dt><dd className="mt-1 font-semibold text-[#42474F]">{user.city}, {user.country}</dd></div><div><dt className="text-xs text-[#747A81]">Telefone</dt><dd className="mt-1 font-semibold text-[#42474F]">{user.phone || "Não informado"}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-[#747A81]">ID da conta</dt><dd className="mt-1 break-all font-mono text-xs text-[#42474F]">{user.id}</dd></div></dl></aside>;
}

function VerificationQueue({ requests, busy, onDecide }: { requests: Verification[]; busy: string | null; onDecide: (request: Verification, approve: boolean) => void }) {
  if (requests.length === 0) return <EmptyState title="Nenhuma verificação pendente" detail="Quando um profissional enviar uma solicitação, ela aparecerá aqui para análise documentada." />;
  return <div className="space-y-3">{requests.map((request) => { const person = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles; return <article key={request.user_id} className="rounded-2xl border border-[#DDD7CC] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-[#B66A16]" /><h2 className="font-bold text-[#24272B]">{person?.full_name ?? "Profissional"}</h2></div><p className="mt-1 text-sm text-[#626871]">{person?.city ?? "Localização não informada"}, {person?.country ?? ""} · Recebido em {new Date(request.created_at).toLocaleDateString("pt-BR")}</p></div><span className="rounded-full bg-[#FFF2DF] px-3 py-1 text-xs font-bold text-[#8A4A0A]">Aguardando análise</span></div><div className="mt-4 rounded-xl bg-[#F7F4EE] p-4"><p className="text-xs font-bold text-[#626871]">Informação enviada pelo profissional</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#42474F]">{request.matricula_note || "Nenhum detalhe enviado."}</p></div><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy === `verify-${request.user_id}`} onClick={() => onDecide(request, false)} className="rounded-xl border border-[#D8D1C6] px-4 py-2.5 text-sm font-bold text-[#42474F] hover:border-[#B93829] hover:text-[#9F2D20] disabled:opacity-50">Recusar</button><button type="button" disabled={busy === `verify-${request.user_id}`} onClick={() => onDecide(request, true)} className="inline-flex items-center gap-2 rounded-xl bg-[#16805D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#106B4D] disabled:opacity-50"><Check className="h-4 w-4" /> Aprovar</button></div></article>;})}</div>;
}

function ReportQueue({ reports, busy, onResolve }: { reports: Report[]; busy: string | null; onResolve: (report: Report, resolution: "resolved" | "dismissed") => void }) {
  if (reports.length === 0) return <EmptyState title="Fila de denúncias vazia" detail="Novas denúncias enviadas por usuários aparecerão aqui para análise." />;
  return <div className="space-y-3">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-[#DDD7CC] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#B66A16]" /><h2 className="font-bold capitalize text-[#24272B]">{report.reason.replaceAll("_", " ")}</h2></div><span className="rounded-full bg-[#FCE9E6] px-3 py-1 text-xs font-bold text-[#9F2D20]">Pendente</span></div><p className="mt-3 text-sm leading-6 text-[#42474F]">{report.details || "Sem detalhes adicionais."}</p><dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#747A81]"><div><dt className="inline">Conteúdo: </dt><dd className="inline capitalize">{report.target_type.replaceAll("_", " ")}</dd></div><div><dt className="inline">Enviada: </dt><dd className="inline">{dateLabel(report.created_at)}</dd></div>{report.target_user_id && <div><dt className="inline">Conta citada: </dt><dd className="inline font-mono">{report.target_user_id.slice(0, 8)}</dd></div>}</dl><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy === `report-${report.id}`} onClick={() => onResolve(report, "dismissed")} className="rounded-xl border border-[#D8D1C6] px-4 py-2.5 text-sm font-bold text-[#42474F] hover:bg-[#F7F4EE] disabled:opacity-50">Arquivar</button><button type="button" disabled={busy === `report-${report.id}`} onClick={() => onResolve(report, "resolved")} className="rounded-xl bg-[#24272B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3B3F44] disabled:opacity-50">Resolver</button></div></article>)}</div>;
}

function CategoryList({ categories, busy, onToggle }: { categories: Category[]; busy: string | null; onToggle: (category: Category) => void }) {
  if (categories.length === 0) return <EmptyState title="Nenhuma categoria disponível" detail="As categorias oficiais do catálogo aparecerão aqui." />;
  return <div className="overflow-hidden rounded-2xl border border-[#DDD7CC] bg-white"><div className="border-b border-[#EEE9E0] p-5"><h2 className="font-bold text-[#24272B]">Categorias do catálogo</h2><p className="mt-1 text-sm text-[#747A81]">Ative ou desative itens sem apagar categorias associadas a profissionais.</p></div><div className="divide-y divide-[#EEE9E0]">{categories.map((category) => <div key={category.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><p className="font-bold text-[#24272B]">{category.name_pt_br}</p><p className="mt-0.5 text-sm text-[#747A81]">{category.name_es_ar} · {category.slug}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${category.is_active ? "bg-[#E8F5EE] text-[#146344]" : "bg-[#EEEAE3] text-[#626871]"}`}>{category.is_active ? "Ativa" : "Inativa"}</span><button type="button" disabled={busy === `category-${category.id}`} onClick={() => onToggle(category)} className="rounded-lg border border-[#D8D1C6] px-3 py-2 text-xs font-bold text-[#42474F] hover:border-[#F28C28] disabled:opacity-50">{category.is_active ? "Desativar" : "Ativar"}</button></div></div>)}</div></div>;
}

function ActivityList({ items }: { items: AuditItem[] }) {
  if (items.length === 0) return <EmptyState title="Sem atividade administrativa" detail="As ações executadas no painel serão registradas e exibidas nesta trilha." />;
  return <div className="rounded-2xl border border-[#DDD7CC] bg-white"><div className="border-b border-[#EEE9E0] p-5"><h2 className="font-bold text-[#24272B]">Registro de operações</h2><p className="mt-1 text-sm text-[#747A81]">Histórico somente leitura das ações administrativas recentes.</p></div><ol className="divide-y divide-[#EEE9E0]">{items.map((item) => <li key={item.id} className="flex gap-4 p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFF2DF]"><Activity className="h-4 w-4 text-[#A75508]" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-[#24272B]">{item.summary}</p><p className="mt-1 text-xs text-[#747A81]">{item.action_type.replaceAll("_", " ")} · {item.target_type} · {dateLabel(item.created_at)}</p><p className="mt-1 truncate font-mono text-[10px] text-[#8A8F96]">Registro {item.target_id}</p></div></li>)}</ol></div>;
}
