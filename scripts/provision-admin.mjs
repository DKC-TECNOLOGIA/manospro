import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const fullName = process.env.ADMIN_FULL_NAME?.trim();
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

if (!url || !serviceKey || !email || !fullName || !appUrl) {
  console.error(
    "Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY legado), ADMIN_EMAIL, ADMIN_FULL_NAME e NEXT_PUBLIC_APP_URL no ambiente seguro."
  );
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2) {
  console.error("Informe um e-mail válido e um nome com pelo menos 2 caracteres.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let user = null;
for (let page = 1; page <= 100; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
  if (user || data.users.length < 1000) break;
}

if (!user) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/redefinir-senha`,
    data: { full_name: fullName, country: "BR", city: "São Paulo" },
  });
  if (error) throw error;
  user = data.user;
}

if (!user) throw new Error("O Supabase não retornou o usuário provisionado.");

const { error: membershipError } = await supabase
  .from("admin_memberships")
  .upsert({ user_id: user.id, role: "owner", granted_by: user.id });
if (membershipError) throw membershipError;

const { error: auditError } = await supabase.from("admin_audit_logs").insert({
  admin_id: user.id,
  action_type: "admin_bootstrap",
  target_type: "admin_membership",
  target_id: user.id,
  summary: "Provisionamento do primeiro administrador da plataforma",
  metadata: { role: "owner", source: "secure-server-script" },
});
if (auditError) throw auditError;

console.log(
  `Administrador provisionado para ${email}. ${user.invited_at ? "O convite foi enviado por e-mail." : "A conta existente recebeu acesso administrativo."}`
);
