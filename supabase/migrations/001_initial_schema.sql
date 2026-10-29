-- =============================================================================
-- MANOSPRO — MIGRACIÓN INICIAL (FASE 2: ESQUEMA POSTGRESQL + RLS + SEED)
-- Proyecto Supabase: cvphriyjmrfijmcfblmz
-- =============================================================================

-- 1. EXTENSIONES NECESARIAS
create extension if not exists "pgcrypto";

-- 2. TIPOS ENUMERADOS (DOMINIO MANOSPRO)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_role') then
    create type public.account_role as enum ('client', 'professional', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'country_code') then
    create type public.country_code as enum ('AR', 'BR');
  end if;

  if not exists (select 1 from pg_type where typname = 'currency_code') then
    create type public.currency_code as enum ('ARS', 'BRL');
  end if;

  if not exists (select 1 from pg_type where typname = 'professional_status') then
    create type public.professional_status as enum ('draft', 'published', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type public.verification_status as enum ('unverified', 'pending', 'verified');
  end if;

  if not exists (select 1 from pg_type where typname = 'quote_status') then
    create type public.quote_status as enum ('direct_chat', 'quote_requested', 'quote_sent', 'accepted', 'closed');
  end if;
end $$;

-- 3. FUNCIÓN UTILITARIA PARA ACTUALIZAR updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- =============================================================================
-- 4. TABLAS PRINCIPALES (10 TABLAS OFICIALES)
-- =============================================================================

-- 4.1 Tabla `profiles` (vinculada 1:1 con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null default 'client',
  full_name text not null check (char_length(trim(full_name)) >= 2),
  phone text,
  country public.country_code not null default 'AR',
  city text not null default 'Buenos Aires (CABA)',
  avatar_url text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 4.2 Tabla `categories` (las 8 categorías oficiales bilingües)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  icon_name text not null default 'Wrench',
  name_es_ar text not null,
  name_pt_br text not null,
  description_es_ar text not null,
  description_pt_br text not null,
  examples_es_ar text[] not null default '{}',
  examples_pt_br text[] not null default '{}',
  display_order smallint not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 4.3 Tabla `professional_profiles` (ficha pública/borrador del autónomo)
create table if not exists public.professional_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  slug text not null unique,
  category_slug text not null references public.categories(slug) on update cascade,
  primary_specialty_es_ar text not null default '',
  primary_specialty_pt_br text not null default '',
  secondary_specialties text[] not null default '{}',
  bio text not null default '',
  years_of_experience smallint not null default 0 check (years_of_experience >= 0 and years_of_experience <= 70),
  neighborhood text not null default '',
  coverage_zones text[] not null default '{}',
  languages text[] not null default array['Español'],
  schedule_summary text not null default '',
  accepts_direct_contact boolean not null default true,
  accepts_quote_requests boolean not null default true,
  reference_starting_price numeric(12, 2) check (reference_starting_price is null or reference_starting_price >= 0),
  currency public.currency_code not null default 'ARS',
  status public.professional_status not null default 'draft',
  verification_status public.verification_status not null default 'unverified',
  matricula_note text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 4.4 Tabla `services` (catálogo de servicios y precios de referencia por profesional)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 3),
  description text not null default '',
  reference_price_amount numeric(12, 2) check (reference_price_amount is null or reference_price_amount >= 0),
  currency public.currency_code not null default 'ARS',
  price_unit_label text not null default 'servicio base',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 4.5 Tabla `professional_photos` (galería de trabajos realizados)
create table if not exists public.professional_photos (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  caption text not null default '',
  zone_label text not null default '',
  work_year smallint not null default extract(year from now())::smallint,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 4.6 Tabla `favorites` (profesionales guardados por clientes)
create table if not exists public.favorites (
  client_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (client_id, professional_id)
);

-- 4.7 Tabla `conversations` (hilos de contacto directo o solicitud de presupuesto)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  subject text not null default '',
  quote_status public.quote_status not null default 'direct_chat',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 4.8 Tabla `conversation_participants` (participantes autorizados en cada conversación)
create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc'::text, now()),
  primary key (conversation_id, user_id)
);

-- 4.9 Tabla `messages` (mensajes persistentes en base de datos)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) >= 1),
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 4.10 Tabla `reviews` (calificaciones reales de 1 a 5 estrellas con regla contra duplicidad)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  service_provided text not null default '',
  comment text not null check (char_length(trim(comment)) >= 10),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint reviews_unique_client_per_pro unique (professional_id, client_id),
  constraint reviews_no_self_review check (professional_id <> client_id)
);

-- =============================================================================
-- 5. TRIGGERS DE FECHA DE ACTUALIZACIÓN Y ALTA AUTOMÁTICA DE USUARIO
-- =============================================================================

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

drop trigger if exists set_pro_profiles_updated_at on public.professional_profiles;
create trigger set_pro_profiles_updated_at
before update on public.professional_profiles
for each row execute function public.handle_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row execute function public.handle_updated_at();

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.handle_updated_at();

-- Trigger seguro al registrarse en Supabase Auth:
-- NUNCA permite que un usuario se asigne 'admin' desde el cliente.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_role public.account_role;
  safe_country public.country_code;
  safe_currency public.currency_code;
  safe_name text;
  safe_city text;
  safe_category text;
  generated_slug text;
begin
  if (new.raw_user_meta_data->>'role') = 'professional' then
    safe_role := 'professional';
  else
    safe_role := 'client';
  end if;

  if (new.raw_user_meta_data->>'country') = 'BR' then
    safe_country := 'BR';
    safe_currency := 'BRL';
  else
    safe_country := 'AR';
    safe_currency := 'ARS';
  end if;

  safe_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));
  safe_city := coalesce(nullif(trim(new.raw_user_meta_data->>'city'), ''), 'Buenos Aires (CABA)');
  safe_category := coalesce(nullif(trim(new.raw_user_meta_data->>'category_slug'), ''), 'hogar');

  insert into public.profiles (id, role, full_name, phone, country, city)
  values (
    new.id,
    safe_role,
    safe_name,
    new.raw_user_meta_data->>'phone',
    safe_country,
    safe_city
  );

  if safe_role = 'professional' then
    generated_slug := lower(regexp_replace(safe_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6);
    insert into public.professional_profiles (
      user_id,
      slug,
      category_slug,
      currency,
      status,
      verification_status
    ) values (
      new.id,
      generated_slug,
      safe_category,
      safe_currency,
      'draft',
      'unverified'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- =============================================================================
-- 6. POLÍTICAS ROW LEVEL SECURITY (RLS) ESTRICTAS
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.services enable row level security;
alter table public.professional_photos enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Helper para verificar si el usuario autenticado es admin activo
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_suspended = false
  );
$$;

-- 6.1 RLS `profiles`
drop policy if exists "Lectura pública de perfiles básicos" on public.profiles;
create policy "Lectura pública de perfiles básicos"
on public.profiles for select
using (not is_suspended or auth.uid() = id or public.is_admin());

drop policy if exists "Usuario crea su propio perfil sin rol admin" on public.profiles;
create policy "Usuario crea su propio perfil sin rol admin"
on public.profiles for insert
with check (
  auth.uid() = id
  and role in ('client', 'professional')
  and is_suspended = false
);

drop policy if exists "Usuario actualiza su propio perfil sin escalar rol" on public.profiles;
create policy "Usuario actualiza su propio perfil sin escalar rol"
on public.profiles for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role in ('client', 'professional')
  and is_suspended = (select p.is_suspended from public.profiles p where p.id = auth.uid())
);

-- 6.2 RLS `categories`
drop policy if exists "Lectura pública de categorías activas" on public.categories;
create policy "Lectura pública de categorías activas"
on public.categories for select
using (is_active = true or public.is_admin());

drop policy if exists "Solo administradores gestionan categorías" on public.categories;
create policy "Solo administradores gestionan categorías"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

-- 6.3 RLS `professional_profiles`
drop policy if exists "Lectura de fichas publicadas o propio borrador" on public.professional_profiles;
create policy "Lectura de fichas publicadas o propio borrador"
on public.professional_profiles for select
using (status = 'published' or auth.uid() = user_id or public.is_admin());

drop policy if exists "Profesional crea su propia ficha sin auto-verificarse" on public.professional_profiles;
create policy "Profesional crea su propia ficha sin auto-verificarse"
on public.professional_profiles for insert
with check (
  auth.uid() = user_id
  and verification_status = 'unverified'
  and status in ('draft', 'published')
);

drop policy if exists "Profesional edita su propia ficha sin auto-verificarse" on public.professional_profiles;
create policy "Profesional edita su propia ficha sin auto-verificarse"
on public.professional_profiles for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and verification_status = (
    select pp.verification_status from public.professional_profiles pp where pp.user_id = auth.uid()
  )
);

-- 6.4 RLS `services`
drop policy if exists "Lectura pública de servicios" on public.services;
create policy "Lectura pública de servicios"
on public.services for select
using (true);

drop policy if exists "Profesional gestiona sus propios servicios" on public.services;
create policy "Profesional gestiona sus propios servicios"
on public.services for all
using (auth.uid() = professional_id)
with check (auth.uid() = professional_id);

-- 6.5 RLS `professional_photos`
drop policy if exists "Lectura pública de fotos de trabajos" on public.professional_photos;
create policy "Lectura pública de fotos de trabajos"
on public.professional_photos for select
using (true);

drop policy if exists "Profesional gestiona sus propias fotos" on public.professional_photos;
create policy "Profesional gestiona sus propias fotos"
on public.professional_photos for all
using (auth.uid() = professional_id)
with check (auth.uid() = professional_id);

-- 6.6 RLS `favorites`
drop policy if exists "Cliente gestiona sus propios favoritos" on public.favorites;
create policy "Cliente gestiona sus propios favoritos"
on public.favorites for all
using (auth.uid() = client_id)
with check (auth.uid() = client_id);

-- 6.7 RLS `conversations`, `conversation_participants` y `messages`
drop policy if exists "Participantes leen sus conversaciones" on public.conversations;
create policy "Participantes leen sus conversaciones"
on public.conversations for select
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participantes ven integrantes de sus conversaciones" on public.conversation_participants;
create policy "Participantes ven integrantes de sus conversaciones"
on public.conversation_participants for select
using (
  user_id = auth.uid() or exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_participants.conversation_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participantes leen mensajes de su conversación" on public.messages;
create policy "Participantes leen mensajes de su conversación"
on public.messages for select
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participantes envían mensajes en su conversación" on public.messages;
create policy "Participantes envían mensajes en su conversación"
on public.messages for insert
with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  )
);

-- 6.8 RLS `reviews`
drop policy if exists "Lectura pública de reseñas" on public.reviews;
create policy "Lectura pública de reseñas"
on public.reviews for select
using (true);

drop policy if exists "Cliente autenticado publica reseña propia" on public.reviews;
create policy "Cliente autenticado publica reseña propia"
on public.reviews for insert
with check (auth.uid() = client_id and auth.uid() <> professional_id);

-- =============================================================================
-- 7. SEED DE LAS 8 CATEGORÍAS OFICIALES MANOSPRO
-- =============================================================================

insert into public.categories (
  slug, icon_name, name_es_ar, name_pt_br, description_es_ar, description_pt_br, examples_es_ar, examples_pt_br, display_order
) values
  (
    'construccion',
    'Hammer',
    'Construcción',
    'Construção',
    'Obras, remodelaciones, pintura, construcción en seco y revestimientos.',
    'Obras, reformas, pintura, drywall, gesso e revestimentos cerâmicos.',
    array['Albañil', 'Pintor de obra', 'Durlero / Yesero', 'Colocador de pisos'],
    array['Pedreiro', 'Pintor', 'Gesseiro / Drywall', 'Assentador de pisos'],
    1
  ),
  (
    'hogar',
    'Wrench',
    'Hogar',
    'Casa e Reparos',
    'Soluciones rápidas y mantenimiento integral para viviendas y comercios.',
    'Soluções rápidas e manutenção residencial ou comercial sob medida.',
    array['Plomero', 'Carpintero', 'Cerrajero 24h', 'Reparaciones del hogar'],
    array['Encanador', 'Marceneiro', 'Chaveiro', 'Marido de aluguel / Reparos'],
    2
  ),
  (
    'electricidad-y-gas',
    'Zap',
    'Electricidad y Gas',
    'Elétrica e Gás',
    'Instalaciones seguras, tableros, artefactos de gas y climatización.',
    'Instalações seguras, quadros elétricos, tubulação de gás e climatização.',
    array['Electricista', 'Gasista matriculado', 'Instalación de aire acondicionado'],
    array['Eletricista', 'Instalador de gás', 'Ar-condicionado e climatização'],
    3
  ),
  (
    'belleza-y-bienestar',
    'Sparkles',
    'Belleza y Bienestar',
    'Beleza e Bem-estar',
    'Atención personal a domicilio o en estudio con turno acordado.',
    'Atendimento personalizado em domicílio ou estúdio com horário marcado.',
    array['Esteticista', 'Peluquero/a', 'Manicura', 'Masajista profesional'],
    array['Esteticista', 'Cabeleireiro(a)', 'Manicure e pedicure', 'Massoterapeuta'],
    4
  ),
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
