import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const read = (path) => readFile(resolve(root, path), "utf8");

test("account and admin frontend call the privacy RPCs introduced by migration A", async () => {
  const [account, admin, migrationA] = await Promise.all([
    read("src/app/conta/page.tsx"),
    read("src/app/admin/page.tsx"),
    read("supabase/migrations/20261104193000_secure_personal_profile_fields.sql"),
  ]);

  assert.match(account, /rpc\("get_own_phone"\)/);
  assert.match(admin, /rpc\("admin_list_pending_verifications"\)/);
  assert.match(migrationA, /create or replace function public\.get_own_phone\(\)/i);
  assert.match(migrationA, /create or replace function public\.admin_list_pending_verifications\(\)/i);
});

test("frontend conversation RPC arguments and initial statuses match the guarded SQL contract", async () => {
  const [service, detail, migration] = await Promise.all([
    read("src/services/supabase/messaging.ts"),
    read("src/app/profissionais/[slug]/page.tsx"),
    read("supabase/migrations/20261117182340_secure_profile_and_conversation_flows.sql"),
  ]);

  for (const argument of ["target_user_id", "initial_subject", "initial_quote_status", "initial_message"]) {
    assert.match(service, new RegExp(`${argument}:`));
  }
  assert.match(detail, /setContactMode\("direct_chat"\)/);
  assert.match(detail, /setContactMode\("quote_requested"\)/);
  assert.match(migration, /initial_quote_status not in \('direct_chat', 'quote_requested'\)/i);
  assert.match(migration, /pp\.accepts_direct_contact/i);
  assert.match(migration, /pp\.accepts_quote_requests/i);
});

test("column grants keep the frontend's required public fields while excluding personal fields", async () => {
  const [migrationB, professionalPage] = await Promise.all([
    read("supabase/migrations/20261104193100_restrict_profile_select_columns.sql"),
    read("src/app/profissional/page.tsx"),
  ]);

  assert.match(migrationB, /revoke select \(phone\).*public\.profiles from public, anon, authenticated/is);
  assert.match(migrationB, /revoke select \(matricula_note\).*public\.professional_profiles from public, anon, authenticated/is);
  assert.match(migrationB, /grant select \(role, created_at, updated_at\).*to authenticated/is);
  assert.doesNotMatch(professionalPage, /matricula_note/);
});

test("privacy migration does not revoke writes used by account settings", async () => {
  const [account, migrationB] = await Promise.all([
    read("src/features/auth/components/AccountSettings.tsx"),
    read("supabase/migrations/20261104193100_restrict_profile_select_columns.sql"),
  ]);

  assert.match(account, /\.from\("profiles"\)[\s\S]{0,300}\.update\(/);
  assert.match(migrationB, /INSERT\/UPDATE de tabela n[aã]o s[aã]o alterados/i);
  assert.doesNotMatch(migrationB, /revoke\s+update/i);
});

test("professional onboarding saves role and profile through the atomic RPC introduced in C0", async () => {
  const [service, migrationC0, migrationC1] = await Promise.all([
    read("src/services/supabase/professionals.ts"),
    read("supabase/migrations/20261104193030_add_profile_workflow_rpcs_compat.sql"),
    read("supabase/migrations/20261117182340_secure_profile_and_conversation_flows.sql"),
  ]);

  assert.match(service, /rpc\("save_own_professional_profile"/);
  assert.doesNotMatch(service, /from\("profiles"\)\.upsert/);
  assert.doesNotMatch(service, /from\("professional_profiles"\)\.upsert/);
  assert.match(migrationC0, /create or replace function public\.save_own_professional_profile\(p_profile jsonb\)/i);
  assert.match(migrationC0, /grant execute on function public\.save_own_professional_profile\(jsonb\) to authenticated/i);
  assert.match(migrationC0, /create or replace function public\.switch_own_account_to_client\(\)/i);
  // C0 must stay backward-compatible with the old frontend until C1 runs after B.
  assert.doesNotMatch(migrationC0, /revoke\s+insert,\s*update,\s*delete\s+on\s+table\s+public\.professional_profiles/i);
  assert.doesNotMatch(migrationC0, /create\s+trigger\s+trg_protect_profile_sensitive_fields/i);
  // C1 applies the enforcement triggers and revokes direct table writes.
  assert.match(migrationC1, /create\s+trigger\s+trg_protect_profile_sensitive_fields/i);
  assert.match(migrationC1, /revoke\s+insert,\s*update,\s*delete\s+on\s+table\s+public\.professional_profiles/i);
});

test("mobile auth reads only profile columns granted after migration B", async (t) => {
  const mobileAuthPath = resolve(root, "apps/mobile/src/features/auth/AuthProvider.tsx");
  if (!existsSync(mobileAuthPath)) {
    t.skip("apps/mobile is not present in this checkout; mobile auth contract is validated in the mobile workspace");
    return;
  }

  const [authProvider, migrationB] = await Promise.all([
    readFile(mobileAuthPath, "utf8"),
    read("supabase/migrations/20261104193100_restrict_profile_select_columns.sql"),
  ]);

  assert.match(authProvider, /from\('profiles'\)\.select\('role, full_name, is_suspended'\)/);
  assert.match(migrationB, /grant select \(id, full_name, country, city, avatar_url, is_suspended\)[\s\S]*role, created_at, updated_at[\s\S]*to authenticated/i);
  assert.doesNotMatch(authProvider, /from\('profiles'\)\.select\([^)]*phone/);
});

test("professional workspace uses guarded RPCs for verification, own note, and client switch without leaking raw SQL errors", async () => {
  const [proPage, service] = await Promise.all([
    read("src/app/profissional/page.tsx"),
    read("src/services/supabase/professionals.ts"),
  ]);

  assert.match(proPage, /fetchOwnVerificationNote/);
  assert.match(proPage, /requestOwnProfessionalVerification/);
  assert.match(proPage, /switchOwnAccountToClient/);
  assert.match(proPage, /disabled=\{!canPublish\}/);
  assert.match(service, /rpc\("get_own_verification_note"\)/);
  assert.match(service, /rpc\("request_professional_verification"/);
  assert.match(service, /rpc\("switch_own_account_to_client"\)/);
  assert.match(service, /mapProfessionalRpcError/);
  assert.doesNotMatch(service, /if \(error\) throw new Error\(error\.message\)/);
});
