-- Fase C0 (aditiva e compatível com o frontend antigo):
-- Introduz a tabela interna de autorização transacional e as RPCs de perfil/papel
-- (save_own_professional_profile e switch_own_account_to_client) SEM revogar
-- escritas diretas nem substituir os triggers vigentes.
-- Ordem segura de rollout: A (20261104193000) -> C0 (20261104193030) ->
-- deploy frontend novo -> B (20261104193100) -> C1 (20261117182340).

-- Transaction-scoped permits distinguish approved workflows from direct REST writes.
create table if not exists private.profile_transition_authorizations (
  transaction_id bigint not null,
  user_id uuid not null,
  action text not null check (action in ('role_change', 'profile_save', 'verification_request')),
  target_role public.account_role,
  primary key (transaction_id, user_id, action)
);
alter table private.profile_transition_authorizations enable row level security;
revoke all on table private.profile_transition_authorizations from public, anon, authenticated, service_role;

create or replace function private.has_profile_transition_authorization(
  p_user_id uuid,
  p_action text,
  p_target_role public.account_role default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.profile_transition_authorizations a
    where a.transaction_id = pg_catalog.txid_current()
      and a.user_id = p_user_id
      and a.action = p_action
      and (p_target_role is null or a.target_role = p_target_role)
  );
$$;
alter function private.has_profile_transition_authorization(uuid, text, public.account_role) owner to postgres;
revoke all on function private.has_profile_transition_authorization(uuid, text, public.account_role) from public, anon, authenticated;

create or replace function public.save_own_professional_profile(p_profile jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  v_old_role public.account_role;
  account_suspended boolean;
  current_verification public.verification_status;
  current_profile_status public.professional_status;
  current_verification_note text;
  profile_name text := btrim(coalesce(p_profile->>'full_name', ''));
  profile_city text := btrim(coalesce(p_profile->>'city', ''));
  profile_slug text;
  category text := btrim(coalesce(p_profile->>'category_slug', ''));
  specialty_es text := btrim(coalesce(p_profile->>'primary_specialty_es_ar', ''));
  specialty_pt text := btrim(coalesce(nullif(p_profile->>'primary_specialty_pt_br', ''), p_profile->>'primary_specialty_es_ar', ''));
  selected_country public.country_code;
  selected_status public.professional_status;
  selected_years smallint;
  selected_price numeric;
begin
  if actor_id is null then
    raise exception 'Sign in to save a professional profile.' using errcode = '42501';
  end if;
  if p_profile is null or pg_catalog.jsonb_typeof(p_profile) <> 'object' then
    raise exception 'Professional profile data is invalid.' using errcode = '22023';
  end if;

  select p.role, p.is_suspended into v_old_role, account_suspended
  from public.profiles p where p.id = actor_id for update;
  if not found or account_suspended then
    raise exception 'This account cannot create or edit a professional profile.' using errcode = '42501';
  end if;
  if v_old_role not in ('client', 'professional') then
    raise exception 'Only client accounts can create a professional profile.' using errcode = '42501';
  end if;

  if profile_name is null or pg_catalog.char_length(profile_name) < 3
    or profile_city = '' or pg_catalog.char_length(specialty_es) < 3 then
    raise exception 'Complete your public name, city, and primary specialty first.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.categories c where c.slug = category and c.is_active) then
    raise exception 'Choose an active service category.' using errcode = '22023';
  end if;

  selected_country := coalesce(nullif(p_profile->>'country', '')::public.country_code, 'AR'::public.country_code);
  selected_status := coalesce(nullif(p_profile->>'status', '')::public.professional_status, 'draft'::public.professional_status);
  if selected_status not in ('draft', 'published') then
    raise exception 'Professional profiles can only be saved as draft or published.' using errcode = '22023';
  end if;
  if v_old_role = 'client' and selected_status <> 'draft' then
    raise exception 'A new professional profile must start as a draft.' using errcode = '42501';
  end if;

  select pp.verification_status, pp.status, pp.matricula_note
    into current_verification, current_profile_status, current_verification_note
  from public.professional_profiles pp where pp.user_id = actor_id for update;
  if current_profile_status = 'suspended' then
    raise exception 'Only an administrator can reactivate a suspended professional profile.' using errcode = '42501';
  end if;
  if selected_status = 'published' and current_verification is distinct from 'verified' then
    raise exception 'Professional verification is required before publication.' using errcode = '42501';
  end if;

  profile_slug := pg_catalog.regexp_replace(
    pg_catalog.lower(btrim(coalesce(p_profile->>'slug', ''))),
    '[^a-z0-9-]+', '-', 'g'
  );
  profile_slug := pg_catalog.regexp_replace(profile_slug, '(^-+|-+$)', '', 'g');
  if pg_catalog.char_length(profile_slug) < 3 then
    profile_slug := 'professional-' || pg_catalog.left(actor_id::text, 8);
  end if;

  selected_years := greatest(0, least(70, coalesce(nullif(p_profile->>'years_of_experience', '')::smallint, 0)));
  selected_price := nullif(p_profile->>'reference_starting_price', '')::numeric;
  if selected_price is not null and selected_price <= 0 then selected_price := null; end if;

  insert into private.profile_transition_authorizations(transaction_id, user_id, action, target_role)
  values (pg_catalog.txid_current(), actor_id, 'profile_save', null)
  on conflict (transaction_id, user_id, action) do nothing;
  if v_old_role = 'client' then
    insert into private.profile_transition_authorizations(transaction_id, user_id, action, target_role)
    values (pg_catalog.txid_current(), actor_id, 'role_change', 'professional');
  end if;

  update public.profiles p
  set role = 'professional',
      full_name = profile_name,
      country = selected_country,
      city = profile_city,
      avatar_url = nullif(btrim(coalesce(p_profile->>'avatar_url', '')), '')
  where p.id = actor_id;

  insert into public.professional_profiles(
    user_id, slug, category_slug, primary_specialty_es_ar, primary_specialty_pt_br,
    secondary_specialties, bio, years_of_experience, neighborhood, coverage_zones,
    languages, schedule_summary, accepts_direct_contact, accepts_quote_requests,
    reference_starting_price, currency, status, verification_status, matricula_note
  ) values (
    actor_id,
    profile_slug,
    category,
    specialty_es,
    specialty_pt,
    case when pg_catalog.jsonb_typeof(p_profile->'secondary_specialties') = 'array'
      then array(select jsonb_array_elements_text(p_profile->'secondary_specialties')) else '{}'::text[] end,
    btrim(coalesce(p_profile->>'bio', '')),
    selected_years,
    btrim(coalesce(p_profile->>'neighborhood', '')),
    case when pg_catalog.jsonb_typeof(p_profile->'coverage_zones') = 'array'
      then array(select jsonb_array_elements_text(p_profile->'coverage_zones')) else '{}'::text[] end,
    case when pg_catalog.jsonb_typeof(p_profile->'languages') = 'array'
      then array(select jsonb_array_elements_text(p_profile->'languages')) else array['Português']::text[] end,
    btrim(coalesce(p_profile->>'schedule_summary', '')),
    coalesce((p_profile->>'accepts_direct_contact')::boolean, true),
    coalesce((p_profile->>'accepts_quote_requests')::boolean, true),
    selected_price,
    case when selected_country = 'BR' then 'BRL'::public.currency_code else 'ARS'::public.currency_code end,
    selected_status,
    coalesce(current_verification, 'unverified'::public.verification_status),
    current_verification_note
  )
  on conflict (user_id) do update set
    slug = excluded.slug,
    category_slug = excluded.category_slug,
    primary_specialty_es_ar = excluded.primary_specialty_es_ar,
    primary_specialty_pt_br = excluded.primary_specialty_pt_br,
    secondary_specialties = excluded.secondary_specialties,
    bio = excluded.bio,
    years_of_experience = excluded.years_of_experience,
    neighborhood = excluded.neighborhood,
    coverage_zones = excluded.coverage_zones,
    languages = excluded.languages,
    schedule_summary = excluded.schedule_summary,
    accepts_direct_contact = excluded.accepts_direct_contact,
    accepts_quote_requests = excluded.accepts_quote_requests,
    reference_starting_price = excluded.reference_starting_price,
    currency = excluded.currency,
    status = excluded.status,
    updated_at = pg_catalog.now();

  delete from private.profile_transition_authorizations
  where transaction_id = pg_catalog.txid_current() and user_id = actor_id
    and action in ('profile_save', 'role_change');
  return profile_slug;
end;
$$;
alter function public.save_own_professional_profile(jsonb) owner to postgres;
revoke all on function public.save_own_professional_profile(jsonb) from public, anon;
grant execute on function public.save_own_professional_profile(jsonb) to authenticated;

create or replace function public.switch_own_account_to_client()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  account_role public.account_role;
  account_suspended boolean;
  has_active_service boolean := false;
begin
  if actor_id is null then
    raise exception 'Sign in to change account type.' using errcode = '42501';
  end if;
  select p.role, p.is_suspended into account_role, account_suspended
  from public.profiles p where p.id = actor_id for update;
  if not found or account_role <> 'professional' or account_suspended then
    raise exception 'This account cannot change to client.' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.conversations c
    join public.conversation_participants cp on cp.conversation_id = c.id
    where cp.user_id = actor_id and c.quote_status in ('quote_requested', 'quote_sent', 'accepted')
  ) then
    raise exception 'Close active quote requests or services before changing to client.' using errcode = '55000';
  end if;
  if pg_catalog.to_regclass('public.service_quotes') is not null then
    execute 'select exists (select 1 from public.service_quotes where professional_id = $1 and status in (''sent'', ''accepted''))'
      into has_active_service using actor_id;
    if has_active_service then
      raise exception 'Close active quote requests or services before changing to client.' using errcode = '55000';
    end if;
  end if;
  if pg_catalog.to_regclass('public.bookings') is not null then
    execute 'select exists (select 1 from public.bookings where professional_id = $1 and status in (''pending_payment'', ''confirmed'', ''in_progress''))'
      into has_active_service using actor_id;
    if has_active_service then
      raise exception 'Complete or cancel active services before changing to client.' using errcode = '55000';
    end if;
  end if;

  insert into private.profile_transition_authorizations(transaction_id, user_id, action, target_role)
  values (pg_catalog.txid_current(), actor_id, 'role_change', 'client');
  update public.professional_profiles set status = 'draft', updated_at = pg_catalog.now()
  where user_id = actor_id and status <> 'draft';
  update public.profiles set role = 'client' where id = actor_id;
  delete from private.profile_transition_authorizations
  where transaction_id = pg_catalog.txid_current() and user_id = actor_id and action = 'role_change';
end;
$$;
alter function public.switch_own_account_to_client() owner to postgres;
revoke all on function public.switch_own_account_to_client() from public, anon;
grant execute on function public.switch_own_account_to_client() to authenticated;

notify pgrst, 'reload schema';
