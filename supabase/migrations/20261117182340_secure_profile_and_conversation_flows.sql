-- Fase C1 (endurecimento pós-frontend e pós-migration B):
-- Depende de A (20261104193000), C0 (20261104193030), deploy do frontend compatível
-- e B (20261104193100). Instala os triggers bloqueadores de papel/verificação/publicação,
-- revoga escritas diretas em professional_profiles e endurece as RPCs de verificação e conversa.

create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    if new.role = 'admin' and old.role <> 'admin' then
      raise exception 'Only an administrator can grant the admin role.' using errcode = '42501';
    end if;
    if new.role is distinct from old.role
      and not private.has_profile_transition_authorization(new.id, 'role_change', new.role) then
      raise exception 'Use the approved account-role workflow to change your role.' using errcode = '42501';
    end if;
    if new.is_suspended is distinct from old.is_suspended then
      raise exception 'Only an administrator can change suspension status.' using errcode = '42501';
    end if;
  end if;
  if new.role = 'client' and exists (
    select 1 from public.professional_profiles pp
    where pp.user_id = new.id and pp.status = 'published'
  ) then
    raise exception 'Unpublish the professional profile before changing the account to client.' using errcode = '42501';
  end if;
  return new;
end;
$$;
alter function public.protect_profile_sensitive_fields() owner to postgres;
revoke all on function public.protect_profile_sensitive_fields() from public, anon, authenticated;
drop trigger if exists trg_protect_profile_sensitive_fields on public.profiles;
create trigger trg_protect_profile_sensitive_fields
before update on public.profiles
for each row execute function public.protect_profile_sensitive_fields();

create or replace function public.protect_pro_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_is_admin boolean := private.is_admin();
  profile_role public.account_role;
  account_suspended boolean;
begin
  if tg_op = 'INSERT' then
    if not actor_is_admin
      and not private.has_profile_transition_authorization(actor_id, 'profile_save')
      and (
      new.status <> 'draft'
      or new.verification_status <> 'unverified'
      or new.matricula_note is not null
      ) then
      raise exception 'New professional profiles must start as unverified drafts.' using errcode = '42501';
    end if;
  elsif not actor_is_admin then
    if new.verification_status is distinct from old.verification_status
      and not private.has_profile_transition_authorization(actor_id, 'verification_request') then
      raise exception 'Only an administrator can decide verification; use the verification request RPC.' using errcode = '42501';
    end if;
    if new.matricula_note is distinct from old.matricula_note
      and not private.has_profile_transition_authorization(actor_id, 'verification_request') then
      raise exception 'Use the verification request RPC to update verification documents.' using errcode = '42501';
    end if;
    if new.status is distinct from old.status
      and not private.has_profile_transition_authorization(actor_id, 'profile_save')
      and not private.has_profile_transition_authorization(actor_id, 'role_change', 'client')
      and not private.has_profile_transition_authorization(actor_id, 'verification_request') then
      raise exception 'Use the approved professional-profile workflow to change publication status.' using errcode = '42501';
    end if;
    if old.status = 'suspended' and new.status is distinct from old.status then
      raise exception 'Only an administrator can reactivate a suspended profile.' using errcode = '42501';
    end if;
    if new.status = 'suspended' and new.status is distinct from old.status then
      raise exception 'Only an administrator can suspend a professional profile.' using errcode = '42501';
    end if;
  end if;
  if new.status = 'published' then
    select p.role, p.is_suspended into profile_role, account_suspended
    from public.profiles p where p.id = new.user_id;
    if profile_role is distinct from 'professional'::public.account_role
      or account_suspended is distinct from false
      or new.verification_status is distinct from 'verified'::public.verification_status then
      raise exception 'Only an active, verified professional can publish a profile.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
alter function public.protect_pro_profile_sensitive_fields() owner to postgres;
revoke all on function public.protect_pro_profile_sensitive_fields() from public, anon, authenticated;
drop trigger if exists trg_protect_pro_profile_sensitive_fields on public.professional_profiles;
create trigger trg_protect_pro_profile_sensitive_fields
before insert or update on public.professional_profiles
for each row execute function public.protect_pro_profile_sensitive_fields();

-- All professional-profile writes now go through narrowly authorized RPCs introduced in C0/C1.
revoke insert, update, delete on table public.professional_profiles from public, anon, authenticated;

create or replace function public.request_professional_verification(matricula_or_document_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  clean_note text := pg_catalog.left(btrim(coalesce(matricula_or_document_note, '')), 2000);
  actor_role public.account_role;
  account_suspended boolean;
  current_status public.verification_status;
  profile_status public.professional_status;
begin
  if actor_id is null then
    raise exception 'Sign in to request professional verification.' using errcode = '42501';
  end if;
  if pg_catalog.char_length(clean_note) < 5 then
    raise exception 'Enter at least five characters of verification information.' using errcode = '22023';
  end if;
  select p.role, p.is_suspended into actor_role, account_suspended
  from public.profiles p where p.id = actor_id;
  if actor_role is distinct from 'professional'::public.account_role or account_suspended is distinct from false then
    raise exception 'Only an active professional can request verification.' using errcode = '42501';
  end if;
  select pp.verification_status, pp.status into current_status, profile_status
  from public.professional_profiles pp where pp.user_id = actor_id for update;
  if not found or profile_status = 'suspended' then
    raise exception 'This professional profile cannot request verification.' using errcode = '42501';
  end if;
  if current_status = 'verified' then
    raise exception 'This professional is already verified.' using errcode = '55000';
  end if;

  insert into private.profile_transition_authorizations(transaction_id, user_id, action)
  values (pg_catalog.txid_current(), actor_id, 'verification_request');
  update public.professional_profiles
  set verification_status = 'pending',
      matricula_note = clean_note,
      status = case when status = 'published' then 'draft'::public.professional_status else status end,
      updated_at = pg_catalog.now()
  where user_id = actor_id;
  delete from private.profile_transition_authorizations
  where transaction_id = pg_catalog.txid_current() and user_id = actor_id and action = 'verification_request';
end;
$$;
alter function public.request_professional_verification(text) owner to postgres;
revoke all on function public.request_professional_verification(text) from public, anon;
grant execute on function public.request_professional_verification(text) to authenticated;

create or replace function public.admin_decide_professional_verification(
  target_user_id uuid,
  new_status public.verification_status,
  decision_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  pro_record record;
  clean_note text := btrim(coalesce(decision_note, ''));
begin
  if not private.is_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if clean_note = '' or pg_catalog.char_length(clean_note) < 5 then
    raise exception 'Document the verification decision (minimum five characters).' using errcode = '22023';
  end if;
  select pp.user_id, pp.slug, pp.verification_status, p.full_name
  into pro_record
  from public.professional_profiles pp
  join public.profiles p on p.id = pp.user_id
  where pp.user_id = target_user_id
  for update of pp;
  if not found then
    raise exception 'Professional profile not found.' using errcode = 'P0002';
  end if;

  update public.professional_profiles pp
  set verification_status = new_status,
      matricula_note = clean_note,
      status = case when new_status <> 'verified' and pp.status = 'published'
        then 'draft'::public.professional_status else pp.status end,
      updated_at = pg_catalog.now()
  where pp.user_id = target_user_id;

  insert into public.admin_audit_logs(admin_id, action_type, target_type, target_id, summary, metadata)
  values (
    actor_id,
    'professional_verification_' || new_status::text,
    'professional_profile',
    target_user_id::text,
    'Professional verification (' || new_status::text || '): ' || pro_record.full_name,
    pg_catalog.jsonb_build_object(
      'previousStatus', pro_record.verification_status,
      'newStatus', new_status,
      'decisionNote', clean_note,
      'slug', pro_record.slug
    )
  );
end;
$$;
alter function public.admin_decide_professional_verification(uuid, public.verification_status, text) owner to postgres;
revoke all on function public.admin_decide_professional_verification(uuid, public.verification_status, text) from public, anon;
grant execute on function public.admin_decide_professional_verification(uuid, public.verification_status, text) to authenticated;

create or replace function public.start_or_get_conversation(
  target_user_id uuid,
  initial_subject text default 'Consulta de servicio',
  initial_quote_status public.quote_status default 'direct_chat',
  initial_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_uid uuid := (select auth.uid());
  v_caller_role public.account_role;
  target_allows_contact boolean;
  existing_conv_id uuid;
  new_conv_id uuid;
  clean_subject text := pg_catalog.left(btrim(coalesce(initial_subject, '')), 160);
  clean_message text := btrim(coalesce(initial_message, ''));
begin
  if current_uid is null then
    raise exception 'Sign in to start a conversation.' using errcode = '42501';
  end if;
  if target_user_id is null or current_uid = target_user_id then
    raise exception 'Choose another professional to contact.' using errcode = '22023';
  end if;
  if initial_quote_status is null or initial_quote_status not in ('direct_chat', 'quote_requested') then
    raise exception 'A conversation must start as direct chat or quote request.' using errcode = '22023';
  end if;
  if pg_catalog.char_length(clean_message) > 5000 then
    raise exception 'The initial message is too long.' using errcode = '22023';
  end if;

  select p.role into v_caller_role
  from public.profiles p
  where p.id = current_uid and not p.is_suspended;
  if v_caller_role is null then
    raise exception 'This account cannot start conversations.' using errcode = '42501';
  end if;
  if initial_quote_status = 'quote_requested' and v_caller_role <> 'client' then
    raise exception 'Only client accounts can request a quote.' using errcode = '42501';
  end if;

  select case
    when initial_quote_status = 'direct_chat' then pp.accepts_direct_contact
    else pp.accepts_quote_requests
  end
  into target_allows_contact
  from public.profiles p
  join public.professional_profiles pp on pp.user_id = p.id
  where p.id = target_user_id
    and p.role = 'professional'
    and not p.is_suspended
    and pp.status = 'published'
    and pp.verification_status = 'verified';

  if target_allows_contact is distinct from true then
    raise exception 'This professional is not available for contact.' using errcode = '42501';
  end if;

  -- Serialize starts for a pair to prevent duplicate threads under concurrent requests.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      least(current_uid::text, target_user_id::text) || ':' ||
      greatest(current_uid::text, target_user_id::text), 0
    )
  );

  select c.id into existing_conv_id
  from public.conversations c
  where c.quote_status <> 'closed'
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.user_id = current_uid
    )
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.user_id = target_user_id
    )
    and (select pg_catalog.count(*) from public.conversation_participants cp
         where cp.conversation_id = c.id) = 2
  order by c.created_at desc
  limit 1;

  if existing_conv_id is not null then
    new_conv_id := existing_conv_id;
    if initial_quote_status = 'quote_requested' then
      update public.conversations c
      set quote_status = 'quote_requested',
          subject = coalesce(nullif(clean_subject, ''), c.subject),
          updated_at = pg_catalog.now()
      where c.id = new_conv_id and c.quote_status = 'direct_chat';
    end if;
  else
    insert into public.conversations (subject, quote_status)
    values (
      coalesce(nullif(clean_subject, ''), 'Consulta de servicio'),
      initial_quote_status
    )
    returning id into new_conv_id;

    insert into public.conversation_participants (conversation_id, user_id)
    values (new_conv_id, current_uid), (new_conv_id, target_user_id);
  end if;

  if clean_message <> '' then
    insert into public.messages (conversation_id, sender_id, body)
    values (new_conv_id, current_uid, clean_message);
    update public.conversations c
    set updated_at = pg_catalog.now()
    where c.id = new_conv_id;
  end if;

  return new_conv_id;
end;
$$;
alter function public.start_or_get_conversation(uuid, text, public.quote_status, text) owner to postgres;
revoke all on function public.start_or_get_conversation(uuid, text, public.quote_status, text) from public, anon;
grant execute on function public.start_or_get_conversation(uuid, text, public.quote_status, text) to authenticated;

notify pgrst, 'reload schema';
