-- =============================================================================
-- MANOSPRO — MIGRACIÓN 002 (NO DESTRUCTIVA): CHAT, ADJUNTOS PRIVADOS Y NOTIFICACIONES
-- 1. Corrige la recursión RLS en `conversations`, `conversation_participants` y `messages`
-- 2. Crea RPC atómica `start_or_get_conversation` (evita conversaciones duplicadas)
-- 3. Crea RPC `mark_conversation_messages_read` (actualiza `read_at` con seguridad)
-- 4. Crea tabla `public.notifications` con RLS y triggers sin duplicación (`dedup_key`)
-- 5. Configura bucket privado `chat-attachments` en Supabase Storage con RLS por participante
-- 6. Habilita Supabase Realtime para `messages`, `conversations` y `notifications`
-- =============================================================================

-- 1. Función SECURITY DEFINER sin recursión para verificar membresía en conversación
create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = conv_id and user_id = auth.uid()
  );
$$;

-- Políticas RLS sin recursión para `conversations`
drop policy if exists "Participantes leen sus conversaciones" on public.conversations;
create policy "Participantes leen sus conversaciones"
on public.conversations for select
using (public.is_conversation_member(id));

drop policy if exists "Participantes actualizan estado de su conversación" on public.conversations;
create policy "Participantes actualizan estado de su conversación"
on public.conversations for update
using (public.is_conversation_member(id))
with check (public.is_conversation_member(id));

-- Políticas RLS sin recursión para `conversation_participants`
drop policy if exists "Participantes ven integrantes de sus conversaciones" on public.conversation_participants;
create policy "Participantes ven integrantes de sus conversaciones"
on public.conversation_participants for select
using (user_id = auth.uid() or public.is_conversation_member(conversation_id));

-- Políticas RLS sin recursión para `messages`
drop policy if exists "Participantes leen mensajes de su conversación" on public.messages;
create policy "Participantes leen mensajes de su conversación"
on public.messages for select
using (public.is_conversation_member(conversation_id));

drop policy if exists "Participantes envían mensajes en su conversación" on public.messages;
create policy "Participantes envían mensajes en su conversación"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and public.is_conversation_member(conversation_id)
);

-- 2. RPC atómica para crear o reutilizar conversación entre el usuario autenticado y otro usuario
create or replace function public.start_or_get_conversation(
  target_user_id uuid,
  initial_subject text default 'Consulta de servicio',
  initial_quote_status public.quote_status default 'direct_chat',
  initial_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid := auth.uid();
  existing_conv_id uuid;
  new_conv_id uuid;
begin
  if current_uid is null then
    raise exception 'Debés iniciar sesión para iniciar una conversación.';
  end if;

  if current_uid = target_user_id then
    raise exception 'No podés iniciar una conversación con tu propia cuenta.';
  end if;

  -- Buscar conversación existente entre exactamente estos dos participantes
  select cp1.conversation_id into existing_conv_id
  from public.conversation_participants cp1
  inner join public.conversation_participants cp2
    on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = current_uid
    and cp2.user_id = target_user_id
  limit 1;

  if existing_conv_id is not null then
    new_conv_id := existing_conv_id;
    -- Si se solicita presupuesto sobre una conversación previa de chat directo, actualizar estado
    if initial_quote_status = 'quote_requested' then
      update public.conversations
      set quote_status = 'quote_requested',
          subject = coalesce(nullif(trim(initial_subject), ''), subject),
          updated_at = timezone('utc'::text, now())
      where id = new_conv_id;
    end if;
  else
    insert into public.conversations (subject, quote_status)
    values (
      coalesce(nullif(trim(initial_subject), ''), 'Consulta de servicio'),
      coalesce(initial_quote_status, 'direct_chat')
    )
    returning id into new_conv_id;

    insert into public.conversation_participants (conversation_id, user_id)
    values
      (new_conv_id, current_uid),
      (new_conv_id, target_user_id);
  end if;

  if initial_message is not null and char_length(trim(initial_message)) > 0 then
    insert into public.messages (conversation_id, sender_id, body)
    values (new_conv_id, current_uid, trim(initial_message));

    update public.conversations
    set updated_at = timezone('utc'::text, now())
    where id = new_conv_id;
  end if;

  return new_conv_id;
end;
$$;

-- 3. RPC para marcar como leídos los mensajes recibidos en una conversación
create or replace function public.mark_conversation_messages_read(conv_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer := 0;
begin
  if auth.uid() is null or not public.is_conversation_member(conv_id) then
    raise exception 'No tenés permiso sobre esta conversación.';
  end if;

  update public.messages
  set read_at = timezone('utc'::text, now())
  where conversation_id = conv_id
    and sender_id <> auth.uid()
    and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- 4. Tabla `public.notifications` con prevención de duplicados (`dedup_key`)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  type text not null check (type in ('new_message', 'quote_update')),
  title text not null,
  body text not null default '',
  read_at timestamptz,
  dedup_key text unique,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;

drop policy if exists "Usuario lee sus propias notificaciones" on public.notifications;
create policy "Usuario lee sus propias notificaciones"
on public.notifications for select
using (auth.uid() = user_id);

drop policy if exists "Usuario marca sus propias notificaciones como leídas" on public.notifications;
create policy "Usuario marca sus propias notificaciones como leídas"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Trigger automático de notificación al insertar un mensaje nuevo
create or replace function public.handle_new_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
  conv_subject text;
  participant_record record;
begin
  select full_name into sender_name from public.profiles where id = new.sender_id;
  select subject into conv_subject from public.conversations where id = new.conversation_id;

  -- Actualizar timestamp de la conversación
  update public.conversations
  set updated_at = timezone('utc'::text, now())
  where id = new.conversation_id;

  for participant_record in
    select user_id from public.conversation_participants
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    insert into public.notifications (
      user_id,
      actor_id,
      conversation_id,
      type,
      title,
      body,
      dedup_key
    ) values (
      participant_record.user_id,
      new.sender_id,
      new.conversation_id,
      'new_message',
      coalesce(sender_name, 'Usuario') || ' te envió un mensaje',
      left(new.body, 140),
      'msg:' || new.id::text || ':' || participant_record.user_id::text
    )
    on conflict (dedup_key) do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_on_new_message on public.messages;
create trigger trg_notify_on_new_message
after insert on public.messages
for each row execute function public.handle_new_message_notification();

-- Trigger automático de notificación al cambiar el estado de presupuesto en la conversación
create or replace function public.handle_quote_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_uid uuid := auth.uid();
  participant_record record;
begin
  if new.quote_status is distinct from old.quote_status then
    for participant_record in
      select user_id from public.conversation_participants
      where conversation_id = new.id and (actor_uid is null or user_id <> actor_uid)
    loop
      insert into public.notifications (
        user_id,
        actor_id,
        conversation_id,
        type,
        title,
        body,
        dedup_key
      ) values (
        participant_record.user_id,
        actor_uid,
        new.id,
        'quote_update',
        'Actualización de presupuesto: ' || coalesce(new.subject, 'Conversación'),
        'Nuevo estado: ' || new.quote_status::text,
        'quote:' || new.id::text || ':' || new.quote_status::text || ':' || extract(epoch from now())::bigint::text
      )
      on conflict (dedup_key) do nothing;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_quote_status_change on public.conversations;
create trigger trg_notify_on_quote_status_change
after update on public.conversations
for each row execute function public.handle_quote_status_notification();

-- 5. Bucket privado `chat-attachments` en Supabase Storage + Políticas RLS por conversación
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Participantes leen adjuntos de su conversación" on storage.objects;
create policy "Participantes leen adjuntos de su conversación"
on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Participantes suben adjuntos a su conversación" on storage.objects;
create policy "Participantes suben adjuntos a su conversación"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 6. Habilitar Realtime en las tablas de comunicación (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
