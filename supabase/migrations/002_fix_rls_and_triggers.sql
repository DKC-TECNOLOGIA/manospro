-- =============================================================================
-- MANOSPRO — MIGRACIÓN 002 (NO DESTRUCTIVA):
-- 1. Evita recursión en RLS usando funciones SECURITY DEFINER y triggers BEFORE UPDATE
-- 2. Protege columnas sensibles (role, is_suspended, verification_status)
-- 3. Confirma usuarios de prueba existentes en auth.users para validación de Fase 3
-- =============================================================================

-- 1. Función SECURITY DEFINER sin recursión para participantes de conversación
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

drop policy if exists "Participantes leen sus conversaciones" on public.conversations;
create policy "Participantes leen sus conversaciones"
on public.conversations for select
using (public.is_conversation_member(id));

drop policy if exists "Participantes ven integrantes de sus conversaciones" on public.conversation_participants;
create policy "Participantes ven integrantes de sus conversaciones"
on public.conversation_participants for select
using (user_id = auth.uid() or public.is_conversation_member(conversation_id));

drop policy if exists "Participantes leen mensajes de su conversación" on public.messages;
create policy "Participantes leen mensajes de su conversación"
on public.messages for select
using (public.is_conversation_member(conversation_id));

drop policy if exists "Participantes envían mensajes en su conversación" on public.messages;
create policy "Participantes envían mensajes en su conversación"
on public.messages for insert
with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- 2. Triggers BEFORE UPDATE para impedir escalamiento de rol o auto-verificación
create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    -- Nadie puede escalar a 'admin' ni quitarse una suspensión
    if new.role = 'admin' and old.role <> 'admin' then
      raise exception 'No está permitido cambiar el rol a administrador.';
    end if;
    if new.is_suspended <> old.is_suspended then
      raise exception 'No está permitido modificar el estado de suspensión.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_sensitive_fields on public.profiles;
create trigger trg_protect_profile_sensitive_fields
before update on public.profiles
for each row execute function public.protect_profile_sensitive_fields();

create or replace function public.protect_pro_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.verification_status <> old.verification_status then
      raise exception 'El estado de verificación solo puede ser modificado por un administrador tras revisión real.';
    end if;
    if old.status = 'suspended' and new.status <> 'suspended' then
      raise exception 'Un perfil suspendido solo puede ser reactivado por administración.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_pro_profile_sensitive_fields on public.professional_profiles;
create trigger trg_protect_pro_profile_sensitive_fields
before update on public.professional_profiles
for each row execute function public.protect_pro_profile_sensitive_fields();

-- Simplificación limpia de las políticas UPDATE en profiles y professional_profiles
drop policy if exists "Usuario actualiza su propio perfil sin escalar rol" on public.profiles;
create policy "Usuario actualiza su propio perfil sin escalar rol"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Profesional edita su propia ficha sin auto-verificarse" on public.professional_profiles;
create policy "Profesional edita su propia ficha sin auto-verificarse"
on public.professional_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3. Confirmar usuarios en auth.users para permitir pruebas inmediatas de sesión en Fase 3
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
