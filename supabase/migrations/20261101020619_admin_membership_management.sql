-- Secure, auditable management of administrator access.
-- Only an active owner may grant or revoke non-owner administrator memberships.

create or replace function private.is_admin_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships m
    join public.profiles p on p.id = m.user_id
    where m.user_id = (select auth.uid())
      and m.role = 'owner'
      and p.is_suspended = false
  );
$$;
revoke all on function private.is_admin_owner() from public, anon;
grant execute on function private.is_admin_owner() to authenticated;

create or replace function private.admin_list_members()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare members jsonb;
begin
  if not private.is_admin() then raise exception 'Acesso negado.'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', m.user_id,
    'email', u.email,
    'full_name', coalesce(p.full_name, u.email),
    'role', m.role,
    'granted_at', m.granted_at
  ) order by (m.role = 'owner') desc, m.granted_at asc), '[]'::jsonb)
  into members
  from public.admin_memberships m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id;

  return members;
end;
$$;
revoke all on function private.admin_list_members() from public, anon;
grant execute on function private.admin_list_members() to authenticated;

create or replace function private.admin_grant_membership(target_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clean_email text := lower(trim(coalesce(target_email, '')));
  target_id uuid;
  target_name text;
  target_suspended boolean;
begin
  if not private.is_admin_owner() then raise exception 'Somente o owner pode gerenciar administradores.'; end if;
  if char_length(clean_email) > 254 or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Informe um e-mail válido.';
  end if;

  select u.id, coalesce(p.full_name, u.email), p.is_suspended
  into target_id, target_name, target_suspended
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = clean_email;

  if target_id is null then raise exception 'Essa pessoa precisa criar uma conta no ManosPro antes de receber acesso administrativo.'; end if;
  if target_suspended then raise exception 'Não é possível conceder acesso a uma conta suspensa.'; end if;
  if exists (select 1 from public.admin_memberships where user_id = target_id) then
    raise exception 'Essa conta já possui acesso administrativo.';
  end if;

  insert into public.admin_memberships(user_id, role, granted_by)
  values (target_id, 'admin', actor_id);

  insert into public.admin_audit_logs(admin_id, action_type, target_type, target_id, summary, metadata)
  values (actor_id, 'admin_membership_granted', 'admin_membership', target_id::text,
    'Acesso administrativo concedido: ' || target_name,
    jsonb_build_object('email', clean_email, 'role', 'admin'));
end;
$$;
revoke all on function private.admin_grant_membership(text) from public, anon;
grant execute on function private.admin_grant_membership(text) to authenticated;

create or replace function private.admin_revoke_membership(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_role text;
  target_name text;
  target_email text;
begin
  if not private.is_admin_owner() then raise exception 'Somente o owner pode gerenciar administradores.'; end if;
  if target_user_id = actor_id then raise exception 'Você não pode remover seu próprio acesso.'; end if;

  select m.role, coalesce(p.full_name, u.email), u.email
  into target_role, target_name, target_email
  from public.admin_memberships m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where m.user_id = target_user_id
  for update of m;

  if target_role is null then raise exception 'Acesso administrativo não encontrado.'; end if;
  if target_role = 'owner' then raise exception 'O acesso owner protegido não pode ser removido por esta ação.'; end if;

  delete from public.admin_memberships where user_id = target_user_id;

  insert into public.admin_audit_logs(admin_id, action_type, target_type, target_id, summary, metadata)
  values (actor_id, 'admin_membership_revoked', 'admin_membership', target_user_id::text,
    'Acesso administrativo removido: ' || target_name,
    jsonb_build_object('email', target_email, 'previousRole', target_role));
end;
$$;
revoke all on function private.admin_revoke_membership(uuid) from public, anon;
grant execute on function private.admin_revoke_membership(uuid) to authenticated;

create or replace function public.admin_is_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_admin_owner(); $$;

create or replace function public.admin_list_members()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select private.admin_list_members(); $$;

create or replace function public.admin_grant_membership(target_email text)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.admin_grant_membership(target_email); $$;

create or replace function public.admin_revoke_membership(target_user_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.admin_revoke_membership(target_user_id); $$;

revoke all on function public.admin_is_owner() from public, anon;
revoke all on function public.admin_list_members() from public, anon;
revoke all on function public.admin_grant_membership(text) from public, anon;
revoke all on function public.admin_revoke_membership(uuid) from public, anon;
grant execute on function public.admin_is_owner() to authenticated;
grant execute on function public.admin_list_members() to authenticated;
grant execute on function public.admin_grant_membership(text) to authenticated;
grant execute on function public.admin_revoke_membership(uuid) to authenticated;
