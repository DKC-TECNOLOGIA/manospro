-- Fase B: restringe SELECT por coluna em profiles e professional_profiles.
-- Aplicar SOMENTE depois do deploy do frontend que usa get_own_phone(),
-- get_own_verification_note() e admin_list_pending_verifications()
-- (migration 20261104193000_secure_personal_profile_fields.sql).
-- Atenção: colunas novas nestas tabelas passam a exigir GRANT SELECT explícito.
-- INSERT/UPDATE de tabela não são alterados; seguem protegidos por RLS e pelos
-- triggers protect_profile_sensitive_fields / protect_pro_profile_sensitive_fields.

-- Revoke both table-level and any earlier column-level grants for private fields.
revoke select (phone) on table public.profiles from public, anon, authenticated;
revoke select on table public.profiles from public, anon, authenticated;
grant select (id, full_name, country, city, avatar_url, is_suspended)
  on public.profiles to anon, authenticated;
-- role: login (web/mobile), chat e policies de service_requests/service_quotes.
grant select (role, created_at, updated_at)
  on public.profiles to authenticated;
-- phone: sem SELECT direto (get_own_phone() e RPCs administrativas).

revoke select (matricula_note) on table public.professional_profiles from public, anon, authenticated;
revoke select on table public.professional_profiles from public, anon, authenticated;
grant select (
  user_id, slug, category_slug, primary_specialty_es_ar, primary_specialty_pt_br,
  secondary_specialties, bio, years_of_experience, neighborhood, coverage_zones,
  languages, schedule_summary, accepts_direct_contact, accepts_quote_requests,
  reference_starting_price, currency, status, verification_status, created_at, updated_at
) on public.professional_profiles to anon, authenticated;
-- matricula_note: sem SELECT direto (get_own_verification_note() e admin_list_pending_verifications()).

notify pgrst, 'reload schema';
