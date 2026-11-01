-- Explicit deny policy documents that browser sessions never read or change grants.
drop policy if exists "Client sessions cannot access admin memberships" on public.admin_memberships;
create policy "Client sessions cannot access admin memberships"
on public.admin_memberships for all to anon, authenticated
using (false) with check (false);

create index if not exists admin_memberships_granted_by_idx
  on public.admin_memberships(granted_by) where granted_by is not null;
create index if not exists admin_audit_logs_admin_id_idx
  on public.admin_audit_logs(admin_id);
create index if not exists moderation_reports_status_created_idx
  on public.moderation_reports(status, created_at desc);
create index if not exists moderation_reports_reporter_idx
  on public.moderation_reports(reporter_id);
create index if not exists moderation_reports_target_user_idx
  on public.moderation_reports(target_user_id) where target_user_id is not null;
create index if not exists moderation_reports_resolved_by_idx
  on public.moderation_reports(resolved_by) where resolved_by is not null;

-- This helper must bypass the participant-table policy to prevent RLS recursion.
create or replace function private.is_conversation_member(conv_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conv_id and cp.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_conversation_member(uuid) from public;
grant execute on function private.is_conversation_member(uuid) to authenticated;

create or replace function public.is_conversation_member(conv_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_conversation_member(conv_id);
$$;
revoke all on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- Trigger-only routines are not RPC endpoints.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.handle_new_message_notification() from public, anon, authenticated;
revoke all on function public.handle_quote_status_notification() from public, anon, authenticated;
revoke all on function public.protect_pro_profile_sensitive_fields() from public, anon, authenticated;

-- These user-facing SECURITY DEFINER RPCs require a signed-in session and validate ownership.
revoke all on function public.mark_conversation_messages_read(uuid) from public, anon;
grant execute on function public.mark_conversation_messages_read(uuid) to authenticated;
revoke all on function public.start_or_get_conversation(uuid, text, public.quote_status, text) from public, anon;
grant execute on function public.start_or_get_conversation(uuid, text, public.quote_status, text) to authenticated;
