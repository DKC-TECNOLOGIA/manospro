-- Fase A: RPCs seguras para dados pessoais (phone, matricula_note).
-- Puramente aditiva: não remove nenhum acesso existente. Deve ser aplicada antes
-- do deploy do frontend que consome estas RPCs e antes de
-- 20261104193100_restrict_profile_select_columns.sql.
-- Segue o padrão do projeto: SECURITY DEFINER em `private`, wrapper SECURITY INVOKER em `public`.

-- Telefone do próprio usuário autenticado.
create or replace function private.get_own_phone()
returns text language sql stable security definer set search_path = '' as $$
  select p.phone from public.profiles p where p.id = (select auth.uid());
$$;
alter function private.get_own_phone() owner to postgres;
revoke all on function private.get_own_phone() from public, anon;
grant execute on function private.get_own_phone() to authenticated;

create or replace function public.get_own_phone()
returns text language sql stable security invoker set search_path = '' as $$
  select private.get_own_phone();
$$;
revoke all on function public.get_own_phone() from public, anon;
grant execute on function public.get_own_phone() to authenticated;

-- Nota de matrícula/verificação da própria ficha profissional.
create or replace function private.get_own_verification_note()
returns text language sql stable security definer set search_path = '' as $$
  select pp.matricula_note from public.professional_profiles pp
  where pp.user_id = (select auth.uid());
$$;
alter function private.get_own_verification_note() owner to postgres;
revoke all on function private.get_own_verification_note() from public, anon;
grant execute on function private.get_own_verification_note() to authenticated;

create or replace function public.get_own_verification_note()
returns text language sql stable security invoker set search_path = '' as $$
  select private.get_own_verification_note();
$$;
revoke all on function public.get_own_verification_note() from public, anon;
grant execute on function public.get_own_verification_note() to authenticated;

-- Fila de verificações pendentes para o painel administrativo.
create or replace function private.admin_list_pending_verifications()
returns table (
  user_id uuid, slug text, verification_status public.verification_status,
  matricula_note text, created_at timestamptz,
  full_name text, country text, city text
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not private.is_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return query
    select pp.user_id, pp.slug, pp.verification_status, pp.matricula_note, pp.created_at,
           p.full_name, p.country::text, p.city
    from public.professional_profiles pp
    join public.profiles p on p.id = pp.user_id
    where pp.verification_status = 'pending'
    order by pp.created_at asc
    limit 30;
end;
$$;
alter function private.admin_list_pending_verifications() owner to postgres;
revoke all on function private.admin_list_pending_verifications() from public, anon;
grant execute on function private.admin_list_pending_verifications() to authenticated;

create or replace function public.admin_list_pending_verifications()
returns table (
  user_id uuid, slug text, verification_status public.verification_status,
  matricula_note text, created_at timestamptz,
  full_name text, country text, city text
)
language sql stable security invoker set search_path = '' as $$
  select * from private.admin_list_pending_verifications();
$$;
revoke all on function public.admin_list_pending_verifications() from public, anon;
grant execute on function public.admin_list_pending_verifications() to authenticated;

notify pgrst, 'reload schema';
