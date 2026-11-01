-- Administrative access is kept separate from user-editable profile metadata.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;

create table if not exists public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin', 'moderator')),
  granted_at timestamptz not null default timezone('utc'::text, now()),
  granted_by uuid references auth.users(id) on delete set null
);
alter table public.admin_memberships enable row level security;
revoke all on public.admin_memberships from anon, authenticated;
grant all on public.admin_memberships to service_role;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_memberships m
    join public.profiles p on p.id = m.user_id
    where m.user_id = (select auth.uid()) and p.is_suspended = false
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_admin();
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.admin_list_users(
  p_search text default '', p_status text default 'all',
  p_page integer default 1, p_page_size integer default 20
)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  needle text := left(trim(coalesce(p_search, '')), 120);
  page_no integer := greatest(coalesce(p_page, 1), 1);
  page_size integer := least(greatest(coalesce(p_page_size, 20), 1), 100);
  total bigint;
  user_rows jsonb;
begin
  if not private.is_admin() then raise exception 'Acesso negado.'; end if;
  if p_status not in ('all', 'active', 'suspended') then raise exception 'Filtro inválido.'; end if;

  with matching as (
    select p.id, p.role::text as role, p.full_name, u.email,
      p.country::text as country, p.city, p.is_suspended, p.created_at, p.phone, p.avatar_url
    from public.profiles p join auth.users u on u.id = p.id
    where (p_status = 'all' or (p_status = 'active' and not p.is_suspended)
      or (p_status = 'suspended' and p.is_suspended))
      and (needle = '' or p.full_name ilike '%' || needle || '%' or u.email ilike '%' || needle || '%')
  ) select count(*) into total from matching;

  with matching as (
    select p.id, p.role::text as role, p.full_name, u.email,
      p.country::text as country, p.city, p.is_suspended, p.created_at, p.phone, p.avatar_url
    from public.profiles p join auth.users u on u.id = p.id
    where (p_status = 'all' or (p_status = 'active' and not p.is_suspended)
      or (p_status = 'suspended' and p.is_suspended))
      and (needle = '' or p.full_name ilike '%' || needle || '%' or u.email ilike '%' || needle || '%')
    order by p.created_at desc, p.id limit page_size offset (page_no - 1) * page_size
  ) select coalesce(jsonb_agg(to_jsonb(matching)), '[]'::jsonb) into user_rows from matching;

  return jsonb_build_object('users', user_rows, 'totalCount', total, 'page', page_no, 'pageSize', page_size);
end;
$$;
revoke all on function public.admin_list_users(text, text, integer, integer) from public, anon;
grant execute on function public.admin_list_users(text, text, integer, integer) to authenticated;

create or replace function public.admin_get_dashboard_metrics()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not private.is_admin() then raise exception 'Acesso negado.'; end if;
  select jsonb_build_object(
    'totalUsers', count(*),
    'totalClients', count(*) filter (where p.role = 'client'),
    'totalProfessionals', count(*) filter (where p.role = 'professional'),
    'totalAdmins', (select count(*) from public.admin_memberships),
    'activeAccounts', count(*) filter (where not p.is_suspended),
    'suspendedAccounts', count(*) filter (where p.is_suspended),
    'newUsersThisMonth', count(*) filter (where p.created_at >= date_trunc('month', now())),
    'signupsLast7Days', count(*) filter (where p.created_at >= now() - interval '7 days'),
    'signupsLast30Days', count(*) filter (where p.created_at >= now() - interval '30 days'),
    'arAccounts', count(*) filter (where p.country = 'AR'),
    'brAccounts', count(*) filter (where p.country = 'BR'),
    'publishedProfessionals', (select count(*) from public.professional_profiles where status = 'published'),
    'draftProfessionals', (select count(*) from public.professional_profiles where status = 'draft'),
    'pendingVerifications', (select count(*) from public.professional_profiles where verification_status = 'pending'),
    'verifiedProfessionals', (select count(*) from public.professional_profiles where verification_status = 'verified'),
    'totalQuoteRequests', (select count(*) from public.conversations where quote_status <> 'direct_chat'),
    'totalDirectChats', (select count(*) from public.conversations where quote_status = 'direct_chat'),
    'pendingReports', (select count(*) from public.moderation_reports where status = 'pending'),
    'resolvedReports', (select count(*) from public.moderation_reports where status in ('resolved', 'dismissed'))
  ) into result from public.profiles p;
  return result || jsonb_build_object('revenue', null, 'premiumUsers', null,
    'activeSubscriptions', null, 'cancelledSubscriptions', null);
end;
$$;
revoke all on function public.admin_get_dashboard_metrics() from public, anon;
grant execute on function public.admin_get_dashboard_metrics() to authenticated;

-- Admin-only RPCs from migration 003 must never be callable by anonymous clients.
revoke all on function public.admin_moderate_user_suspension(uuid, boolean, text) from public, anon;
revoke all on function public.admin_decide_professional_verification(uuid, public.verification_status, text) from public, anon;
revoke all on function public.admin_resolve_moderation_report(uuid, text, text, boolean) from public, anon;
revoke all on function public.admin_save_category(text, text, text, text, text, text, text[], text[], smallint, boolean) from public, anon;
grant execute on function public.admin_moderate_user_suspension(uuid, boolean, text) to authenticated;
grant execute on function public.admin_decide_professional_verification(uuid, public.verification_status, text) to authenticated;
grant execute on function public.admin_resolve_moderation_report(uuid, text, text, boolean) to authenticated;
grant execute on function public.admin_save_category(text, text, text, text, text, text, text[], text[], smallint, boolean) to authenticated;
revoke all on function public.request_professional_verification(text) from public, anon;
grant execute on function public.request_professional_verification(text) to authenticated;

-- Do not let an administrator suspend another account with admin privileges.
create or replace function public.admin_moderate_user_suspension(target_user_id uuid, suspend boolean, reason text)
returns void language plpgsql security definer set search_path = public as $$
declare
  actor_id uuid := auth.uid();
  target_record record;
  clean_reason text := trim(coalesce(reason, ''));
begin
  if not public.is_admin() then raise exception 'Acesso negado.'; end if;
  if char_length(clean_reason) < 5 then raise exception 'Informe um motivo com pelo menos cinco caracteres.'; end if;
  if target_user_id = actor_id then raise exception 'Não é permitido suspender a própria conta.'; end if;
  if exists (select 1 from public.admin_memberships where user_id = target_user_id) then
    raise exception 'Contas administrativas estão protegidas.';
  end if;
  select id, role, full_name, is_suspended into target_record
    from public.profiles where id = target_user_id for update;
  if not found then raise exception 'Perfil não encontrado.'; end if;
  update public.profiles set is_suspended = suspend, updated_at = now() where id = target_user_id;
  if target_record.role = 'professional' then
    update public.professional_profiles
      set status = case when suspend then 'suspended'::public.professional_status
        when status = 'suspended' then 'draft'::public.professional_status else status end,
        updated_at = now()
      where user_id = target_user_id;
  end if;
  insert into public.admin_audit_logs(admin_id, action_type, target_type, target_id, summary, metadata)
  values (actor_id, case when suspend then 'user_suspended' else 'user_reactivated' end,
    'profile', target_user_id::text,
    case when suspend then 'Conta suspensa: ' else 'Conta reativada: ' end || target_record.full_name,
    jsonb_build_object('reason', clean_reason, 'previousSuspendedState', target_record.is_suspended,
      'newSuspendedState', suspend, 'targetRole', target_record.role));
end;
$$;
revoke all on function public.admin_moderate_user_suspension(uuid, boolean, text) from public, anon;
grant execute on function public.admin_moderate_user_suspension(uuid, boolean, text) to authenticated;
