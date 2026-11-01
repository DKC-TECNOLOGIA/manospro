-- =============================================================================
-- MANOSPRO — MIGRACIÓN 003 (NO DESTRUCTIVA): PANEL ADMINISTRATIVO, MODERACIÓN Y AUDITORÍA
-- Proyecto Supabase: cvphriyjmrfijmcfblmz
-- =============================================================================
-- OBJETIVOS:
-- 1. Crear tabla `public.moderation_reports` para denuncias de perfiles, fotos y reseñas con RLS estricto.
-- 2. Crear tabla `public.admin_audit_logs` inmutable (solo INSERT vía funciones administrativas y SELECT para admins).
-- 3. Completar políticas RLS de administrador sobre `profiles` y `professional_profiles`.
-- 4. Crear funciones RPC transaccionales (`SECURITY DEFINER`) que verifican `public.is_admin()` en la base de datos:
--    - `admin_get_dashboard_metrics()`
--    - `admin_moderate_user_suspension(target_user_id, suspend, reason)`
--    - `admin_decide_professional_verification(target_user_id, new_status, decision_note)`
--    - `admin_resolve_moderation_report(report_id, new_status, resolution_note, suspend_reported_user)`
--    - `admin_upsert_category(...)`
--    - `request_professional_verification(matricula_or_document_note)` (para que el profesional solicite revisión real)
-- =============================================================================

-- 1. TABLA DE DENUNCIAS (`public.moderation_reports`)
create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('professional_profile', 'photo', 'review')),
  target_user_id uuid references public.profiles(id) on delete set null,
  target_entity_id uuid,
  reason text not null check (reason in ('fraud_or_fake', 'inappropriate_content', 'offensive_behavior', 'spam', 'other')),
  details text not null default '' check (char_length(trim(details)) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists set_moderation_reports_updated_at on public.moderation_reports;
create trigger set_moderation_reports_updated_at
before update on public.moderation_reports
for each row execute function public.handle_updated_at();

alter table public.moderation_reports enable row level security;
grant select, insert, update on public.moderation_reports to authenticated;

-- Cualquier usuario autenticado no suspendido puede crear una denuncia real (como él mismo)
drop policy if exists "Usuarios autenticados crean denuncias reales" on public.moderation_reports;
create policy "Usuarios autenticados crean denuncias reales"
on public.moderation_reports for insert
to authenticated
with check (
  auth.uid() = reporter_id
  and status = 'pending'
  and resolved_by is null
  and resolved_at is null
);

-- El denunciante puede ver sus propias denuncias; los administradores ven todas
drop policy if exists "Lectura de denuncias por autor o administrador" on public.moderation_reports;
create policy "Lectura de denuncias por autor o administrador"
on public.moderation_reports for select
to authenticated
using (auth.uid() = reporter_id or public.is_admin());

-- Solo administradores actualizan el estado de una denuncia
drop policy if exists "Solo administradores moderan denuncias" on public.moderation_reports;
create policy "Solo administradores moderan denuncias"
on public.moderation_reports for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =============================================================================
-- 2. TABLA DE AUDITORÍA ADMINISTRATIVA (`public.admin_audit_logs`)
-- =============================================================================
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action_type text not null,
  target_type text not null,
  target_id text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.admin_audit_logs enable row level security;
grant select on public.admin_audit_logs to authenticated;

-- Solo administradores activos pueden consultar el registro de auditoría
drop policy if exists "Solo administradores leen auditoría" on public.admin_audit_logs;
create policy "Solo administradores leen auditoría"
on public.admin_audit_logs for select
to authenticated
using (public.is_admin());

-- Solo administradores activos pueden insertar registros de auditoría (nunca borrar ni editar)
drop policy if exists "Solo administradores insertan auditoría" on public.admin_audit_logs;
create policy "Solo administradores insertan auditoría"
on public.admin_audit_logs for insert
to authenticated
with check (public.is_admin() and admin_id = auth.uid());

-- =============================================================================
-- 3. POLÍTICAS RLS DE ADMINISTRADOR EN `profiles` Y `professional_profiles`
-- =============================================================================
drop policy if exists "Administrador actualiza perfiles con control de seguridad" on public.profiles;
create policy "Administrador actualiza perfiles con control de seguridad"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Administrador actualiza fichas profesionales" on public.professional_profiles;
create policy "Administrador actualiza fichas profesionales"
on public.professional_profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =============================================================================
-- 4. FUNCIONES RPC DE MODERACIÓN, MÉTRICAS REALES Y AUDITORÍA
-- =============================================================================

-- 4.1 Indicadores reales del Dashboard Administrativo (sin datos ficticios)
create or replace function public.admin_get_dashboard_metrics()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  total_clients bigint;
  total_professionals bigint;
  total_admins bigint;
  active_accounts bigint;
  suspended_accounts bigint;
  published_professionals bigint;
  draft_professionals bigint;
  pending_verifications bigint;
  verified_professionals bigint;
  total_quote_requests bigint;
  total_direct_chats bigint;
  pending_reports bigint;
  resolved_reports bigint;
  signups_last_7_days bigint;
  signups_last_30_days bigint;
  ar_accounts bigint;
  br_accounts bigint;
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado: se requiere rol de administrador activo.';
  end if;

  select count(*) into total_clients from public.profiles where role = 'client';
  select count(*) into total_professionals from public.profiles where role = 'professional';
  select count(*) into total_admins from public.profiles where role = 'admin';
  select count(*) into active_accounts from public.profiles where is_suspended = false;
  select count(*) into suspended_accounts from public.profiles where is_suspended = true;
  select count(*) into ar_accounts from public.profiles where country = 'AR';
  select count(*) into br_accounts from public.profiles where country = 'BR';

  select count(*) into published_professionals from public.professional_profiles where status = 'published';
  select count(*) into draft_professionals from public.professional_profiles where status = 'draft';
  select count(*) into pending_verifications from public.professional_profiles where verification_status = 'pending';
  select count(*) into verified_professionals from public.professional_profiles where verification_status = 'verified';

  select count(*) into total_quote_requests from public.conversations where quote_status <> 'direct_chat';
  select count(*) into total_direct_chats from public.conversations where quote_status = 'direct_chat';

  select count(*) into pending_reports from public.moderation_reports where status = 'pending';
  select count(*) into resolved_reports from public.moderation_reports where status in ('resolved', 'dismissed');

  select count(*) into signups_last_7_days
  from public.profiles
  where created_at >= timezone('utc'::text, now()) - interval '7 days';

  select count(*) into signups_last_30_days
  from public.profiles
  where created_at >= timezone('utc'::text, now()) - interval '30 days';

  return jsonb_build_object(
    'totalClients', total_clients,
    'totalProfessionals', total_professionals,
    'totalAdmins', total_admins,
    'activeAccounts', active_accounts,
    'suspendedAccounts', suspended_accounts,
    'arAccounts', ar_accounts,
    'brAccounts', br_accounts,
    'publishedProfessionals', published_professionals,
    'draftProfessionals', draft_professionals,
    'pendingVerifications', pending_verifications,
    'verifiedProfessionals', verified_professionals,
    'totalQuoteRequests', total_quote_requests,
    'totalDirectChats', total_direct_chats,
    'pendingReports', pending_reports,
    'resolvedReports', resolved_reports,
    'signupsLast7Days', signups_last_7_days,
    'signupsLast30Days', signups_last_30_days
  );
end;
$$;

-- 4.2 Suspender o reactivar cuenta de usuario (impide acciones sobre cuentas admin o propia cuenta)
create or replace function public.admin_moderate_user_suspension(
  target_user_id uuid,
  suspend boolean,
  reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_record record;
  clean_reason text := trim(coalesce(reason, ''));
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado: solo un administrador activo puede suspender o reactivar cuentas.';
  end if;

  if clean_reason = '' or char_length(clean_reason) < 5 then
    raise exception 'Debés indicar un motivo de moderación válido (mínimo 5 caracteres).';
  end if;

  if target_user_id = actor_id then
    raise exception 'Operación bloqueada: no podés suspender tu propia cuenta de administrador.';
  end if;

  select id, role, full_name, is_suspended into target_record
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'El perfil de usuario especificado no existe.';
  end if;

  if target_record.role = 'admin' then
    raise exception 'Operación bloqueada: las cuentas con rol administrador están protegidas.';
  end if;

  update public.profiles
  set is_suspended = suspend,
      updated_at = timezone('utc'::text, now())
  where id = target_user_id;

  -- Si es profesional, reflejar suspensión en su ficha pública
  if target_record.role = 'professional' then
    update public.professional_profiles
    set status = case
        when suspend then 'suspended'::public.professional_status
        when status = 'suspended' then 'draft'::public.professional_status
        else status
      end,
      updated_at = timezone('utc'::text, now())
    where user_id = target_user_id;
  end if;

  insert into public.admin_audit_logs (
    admin_id,
    action_type,
    target_type,
    target_id,
    summary,
    metadata
  ) values (
    actor_id,
    case when suspend then 'user_suspended' else 'user_reactivated' end,
    'profile',
    target_user_id::text,
    case
      when suspend then 'Suspensión de cuenta: ' || target_record.full_name
      else 'Reactivación de cuenta: ' || target_record.full_name
    end,
    jsonb_build_object(
      'reason', clean_reason,
      'previousSuspendedState', target_record.is_suspended,
      'newSuspendedState', suspend,
      'targetRole', target_record.role
    )
  );
end;
$$;

-- 4.3 Decisión administrativa sobre verificación profesional (con registro documental y auditoría)
create or replace function public.admin_decide_professional_verification(
  target_user_id uuid,
  new_status public.verification_status,
  decision_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  pro_record record;
  clean_note text := trim(coalesce(decision_note, ''));
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado: solo un administrador puede modificar el estado de verificación profesional.';
  end if;

  if clean_note = '' or char_length(clean_note) < 5 then
    raise exception 'Debés documentar la decisión o matrícula verificada (mínimo 5 caracteres).';
  end if;

  select pp.user_id, pp.slug, pp.verification_status, p.full_name
  into pro_record
  from public.professional_profiles pp
  inner join public.profiles p on p.id = pp.user_id
  where pp.user_id = target_user_id;

  if not found then
    raise exception 'No se encontró la ficha profesional indicada.';
  end if;

  update public.professional_profiles
  set verification_status = new_status,
      matricula_note = clean_note,
      updated_at = timezone('utc'::text, now())
  where user_id = target_user_id;

  insert into public.admin_audit_logs (
    admin_id,
    action_type,
    target_type,
    target_id,
    summary,
    metadata
  ) values (
    actor_id,
    'professional_verification_' || new_status::text,
    'professional_profile',
    target_user_id::text,
    'Verificación profesional (' || new_status::text || '): ' || pro_record.full_name,
    jsonb_build_object(
      'previousStatus', pro_record.verification_status,
      'newStatus', new_status,
      'decisionNote', clean_note,
      'slug', pro_record.slug
    )
  );
end;
$$;

-- 4.4 Solicitud de verificación por parte del propio profesional
create or replace function public.request_professional_verification(
  matricula_or_document_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid := auth.uid();
  clean_note text := trim(coalesce(matricula_or_document_note, ''));
begin
  if current_uid is null then
    raise exception 'Debés iniciar sesión para solicitar verificación.';
  end if;

  if char_length(clean_note) < 5 then
    raise exception 'Ingresá los datos de tu matrícula o habilitación profesional (mínimo 5 caracteres).';
  end if;

  update public.professional_profiles
  set verification_status = 'pending',
      matricula_note = clean_note,
      updated_at = timezone('utc'::text, now())
  where user_id = current_uid
    and verification_status <> 'verified';
end;
$$;

-- 4.5 Resolver o desestimar una denuncia en la cola de moderación
create or replace function public.admin_resolve_moderation_report(
  report_id uuid,
  new_status text,
  resolution_note text,
  suspend_reported_user boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  rep record;
  clean_note text := trim(coalesce(resolution_note, ''));
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado: solo un administrador puede resolver denuncias.';
  end if;

  if new_status not in ('resolved', 'dismissed') then
    raise exception 'Estado de resolución inválido.';
  end if;

  if char_length(clean_note) < 5 then
    raise exception 'Debés registrar una nota de resolución (mínimo 5 caracteres).';
  end if;

  select * into rep from public.moderation_reports where id = report_id;
  if not found then
    raise exception 'La denuncia indicada no existe.';
  end if;

  update public.moderation_reports
  set status = new_status,
      resolution_note = clean_note,
      resolved_by = actor_id,
      resolved_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  where id = report_id;

  if suspend_reported_user and rep.target_user_id is not null then
    perform public.admin_moderate_user_suspension(
      rep.target_user_id,
      true,
      'Suspensión por denuncia #' || left(report_id::text, 8) || ': ' || clean_note
    );
  end if;

  insert into public.admin_audit_logs (
    admin_id,
    action_type,
    target_type,
    target_id,
    summary,
    metadata
  ) values (
    actor_id,
    'report_' || new_status,
    'moderation_report',
    report_id::text,
    'Moderación de denuncia (' || new_status || ') motivo: ' || rep.reason,
    jsonb_build_object(
      'reportId', report_id,
      'targetType', rep.target_type,
      'targetUserId', rep.target_user_id,
      'newStatus', new_status,
      'resolutionNote', clean_note,
      'suspendedUser', suspend_reported_user
    )
  );
end;
$$;

-- 4.6 Crear o editar categoría preservando profesionales asociados y auditando el cambio
create or replace function public.admin_save_category(
  p_slug text,
  p_icon_name text,
  p_name_es_ar text,
  p_name_pt_br text,
  p_description_es_ar text,
  p_description_pt_br text,
  p_examples_es_ar text[],
  p_examples_pt_br text[],
  p_display_order smallint,
  p_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  normalized_slug text := lower(trim(regexp_replace(coalesce(p_slug, ''), '[^a-zA-Z0-9-]+', '-', 'g')));
  saved_id uuid;
  is_update boolean := false;
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado: solo un administrador puede gestionar categorías.';
  end if;

  if char_length(normalized_slug) < 2 then
    raise exception 'El identificador (slug) de la categoría no es válido.';
  end if;

  if char_length(trim(coalesce(p_name_es_ar, ''))) < 2 or char_length(trim(coalesce(p_name_pt_br, ''))) < 2 then
    raise exception 'Los nombres en español y portugués son obligatorios.';
  end if;

  select exists(select 1 from public.categories where slug = normalized_slug) into is_update;

  insert into public.categories (
    slug,
    icon_name,
    name_es_ar,
    name_pt_br,
    description_es_ar,
    description_pt_br,
    examples_es_ar,
    examples_pt_br,
    display_order,
    is_active
  ) values (
    normalized_slug,
    coalesce(nullif(trim(p_icon_name), ''), 'Wrench'),
    trim(p_name_es_ar),
    trim(p_name_pt_br),
    trim(coalesce(p_description_es_ar, '')),
    trim(coalesce(p_description_pt_br, '')),
    coalesce(p_examples_es_ar, '{}'),
    coalesce(p_examples_pt_br, '{}'),
    coalesce(p_display_order, 1),
    coalesce(p_is_active, true)
  )
  on conflict (slug) do update
  set icon_name = excluded.icon_name,
      name_es_ar = excluded.name_es_ar,
      name_pt_br = excluded.name_pt_br,
      description_es_ar = excluded.description_es_ar,
      description_pt_br = excluded.description_pt_br,
      examples_es_ar = excluded.examples_es_ar,
      examples_pt_br = excluded.examples_pt_br,
      display_order = excluded.display_order,
      is_active = excluded.is_active
  returning id into saved_id;

  insert into public.admin_audit_logs (
    admin_id,
    action_type,
    target_type,
    target_id,
    summary,
    metadata
  ) values (
    actor_id,
    case when is_update then 'category_updated' else 'category_created' end,
    'category',
    normalized_slug,
    (case when is_update then 'Actualización' else 'Creación' end) || ' de categoría: ' || trim(p_name_es_ar) || ' / ' || trim(p_name_pt_br),
    jsonb_build_object(
      'slug', normalized_slug,
      'isActive', coalesce(p_is_active, true),
      'displayOrder', coalesce(p_display_order, 1)
    )
  );

  return saved_id;
end;
$$;

-- 5. Asegurar las 8 categorías oficiales (incluyendo las 3 faltantes si no estaban insertadas)
insert into public.categories (
  slug, icon_name, name_es_ar, name_pt_br, description_es_ar, description_pt_br, examples_es_ar, examples_pt_br, display_order
) values
  (
    'jardineria',
    'Trees',
    'Jardinería',
    'Jardinagem',
    'Diseño de parques, corte de césped, poda en altura y riego automático.',
    'Paisagismo, corte de grama, poda segura e manutenção de áreas verdes.',
    array['Jardinero', 'Poda y desmalezado', 'Mantenimiento de espacios verdes'],
    array['Jardineiro', 'Poda e limpeza de terrenos', 'Manutenção de jardins'],
    5
  ),
  (
    'transporte',
    'Truck',
    'Transporte',
    'Transporte e Mudanças',
    'Fletes por hora, minifletes, mudanzas con peones y traslados urbanos.',
    'Fretes rápidos, mudanças residenciais com ajudantes e entregas urbanas.',
    array['Fletes y minifletes', 'Mudanzas completas', 'Entregas programadas'],
    array['Fretes e carretos', 'Mudanças residenciais', 'Entregas programadas'],
    6
  ),
  (
    'salud',
    'HeartPulse',
    'Salud',
    'Saúde e Cuidado',
    'Servicios domiciliarios permitidos conforme habilitación y normas aplicables.',
    'Serviços domiciliares permitidos conforme habilitação e normas aplicáveis.',
    array['Acompañante terapéutico', 'Cuidado de adultos mayores', 'Kinesiología a domicilio'],
    array['Cuidador(a) de idosos', 'Fisioterapia domiciliar', 'Acompanhamento domiciliar'],
    7
  ),
  (
    'otros',
    'Layers',
    'Otros',
    'Outros Serviços',
    'Soporte técnico, limpieza profunda de tapizados, eventos y especialidades a demanda.',
    'Suporte técnico, higienização de estofados, eventos e especialidades sob demanda.',
    array['Técnico de PC y redes', 'Limpieza de tapizados', 'Armado de muebles'],
    array['Técnico de informática', 'Limpeza de estofados', 'Montador de móveis'],
    8
  )
on conflict (slug) do nothing;
