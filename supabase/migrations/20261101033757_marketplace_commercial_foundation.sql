
-- Marketplace commercial foundation. All amounts are integer minor units.
-- Monetization starts disabled; enable each revenue stream independently.

do $$ begin
  create type public.commercial_launch_mode as enum ('free', 'commercial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.commercial_payment_mode as enum ('sandbox', 'live');
exception when duplicate_object then null; end $$;

create table if not exists public.platform_commercial_settings (
  id boolean primary key default true check (id),
  launch_mode public.commercial_launch_mode not null default 'free',
  commission_enabled boolean not null default false,
  subscription_sales_enabled boolean not null default false,
  payment_mode public.commercial_payment_mode not null default 'sandbox',
  live_payments_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint live_requires_commercial check (not live_payments_enabled or payment_mode = 'live')
);

insert into public.platform_commercial_settings (id) values (true)
on conflict (id) do nothing;

create table if not exists public.professional_plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null check (plan_code in ('free', 'plus')),
  country public.country_code not null,
  currency public.currency_code not null,
  amount_minor bigint,
  billing_interval text not null default 'monthly' check (billing_interval = 'monthly'),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint plan_price_country_currency check (
    (country = 'BR' and currency = 'BRL') or (country = 'AR' and currency = 'ARS')
  ),
  constraint plan_price_nonnegative check (amount_minor is null or amount_minor >= 0),
  unique (plan_code, country, currency, billing_interval)
);

insert into public.professional_plan_prices (plan_code, country, currency, amount_minor, is_active)
values ('free', 'BR', 'BRL', 0, true), ('plus', 'BR', 'BRL', 2990, false),
       ('free', 'AR', 'ARS', 0, true), ('plus', 'AR', 'ARS', null, false)
on conflict (plan_code, country, currency, billing_interval) do nothing;

create table if not exists public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  country public.country_code not null,
  category_slug text references public.categories(slug) on update cascade on delete restrict,
  plan_code text not null check (plan_code in ('free', 'plus')),
  rate_bps integer not null check (rate_bps between 0 and 10000),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint commission_rule_dates check (valid_until is null or valid_until > valid_from)
);

create index if not exists commission_rules_lookup_idx
  on public.commission_rules (country, plan_code, valid_from desc);

insert into public.commission_rules (country, plan_code, rate_bps)
values ('BR', 'free', 800), ('BR', 'plus', 300), ('AR', 'free', 800), ('AR', 'plus', 300)
on conflict do nothing;

create table if not exists public.professional_subscriptions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete restrict,
  plan_price_id uuid not null references public.professional_plan_prices(id) on delete restrict,
  provider_id text,
  external_subscription_id text,
  status text not null check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired', 'suspended')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_period_valid check (current_period_end is null or current_period_start is null or current_period_end > current_period_start),
  unique (provider_id, external_subscription_id)
);

create index if not exists professional_subscriptions_owner_idx
  on public.professional_subscriptions (professional_id, status, current_period_end desc);

create table if not exists public.professional_entitlements (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(user_id) on delete restrict,
  entitlement_code text not null check (entitlement_code in ('plus')),
  source text not null check (source in ('promotion', 'subscription', 'admin_grant')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint entitlement_period_valid check (ends_at > starts_at)
);

create index if not exists professional_entitlements_active_idx
  on public.professional_entitlements (professional_id, entitlement_code, ends_at desc);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  category_slug text not null references public.categories(slug) on update cascade on delete restrict,
  country public.country_code not null,
  currency public.currency_code not null,
  title text not null check (char_length(trim(title)) between 5 and 140),
  description text not null check (char_length(trim(description)) between 10 and 5000),
  city text not null,
  attachment_paths text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'quoted', 'booked', 'cancelled', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint request_country_currency check (
    (country = 'BR' and currency = 'BRL') or (country = 'AR' and currency = 'ARS')
  )
);

create index if not exists service_requests_client_idx on public.service_requests (client_id, created_at desc);
create index if not exists service_requests_open_idx on public.service_requests (country, category_slug, status, created_at desc);

create table if not exists public.service_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete restrict,
  professional_id uuid not null references public.professional_profiles(user_id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  currency public.currency_code not null,
  description text not null check (char_length(trim(description)) between 5 and 3000),
  valid_until timestamptz,
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'withdrawn', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_validity_future check (valid_until is null or valid_until > created_at)
);

create index if not exists service_quotes_request_idx on public.service_quotes (request_id, created_at desc);
create index if not exists service_quotes_professional_idx on public.service_quotes (professional_id, created_at desc);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete restrict,
  quote_id uuid not null unique references public.service_quotes(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  professional_id uuid not null references public.professional_profiles(user_id) on delete restrict,
  service_amount_minor bigint not null check (service_amount_minor > 0),
  commission_rate_bps integer not null check (commission_rate_bps between 0 and 10000),
  commission_amount_minor bigint not null check (commission_amount_minor >= 0),
  customer_total_minor bigint not null check (customer_total_minor >= service_amount_minor),
  professional_plan_snapshot text not null check (professional_plan_snapshot in ('free', 'plus')),
  commission_rule_id uuid references public.commission_rules(id) on delete restrict,
  country public.country_code not null,
  currency public.currency_code not null,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'payment_failed', 'refunded')),
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint booking_total_matches check (customer_total_minor = service_amount_minor + commission_amount_minor),
  constraint booking_country_currency check (
    (country = 'BR' and currency = 'BRL') or (country = 'AR' and currency = 'ARS')
  )
);

create index if not exists bookings_client_idx on public.bookings (client_id, created_at desc);
create index if not exists bookings_professional_idx on public.bookings (professional_id, created_at desc);

create or replace function public.prevent_booking_snapshot_changes()
returns trigger language plpgsql set search_path = '' as $$
begin
  if row(new.request_id, new.quote_id, new.client_id, new.professional_id, new.service_amount_minor,
         new.commission_rate_bps, new.commission_amount_minor, new.customer_total_minor,
         new.professional_plan_snapshot, new.commission_rule_id, new.country, new.currency, new.accepted_at)
     is distinct from
     row(old.request_id, old.quote_id, old.client_id, old.professional_id, old.service_amount_minor,
         old.commission_rate_bps, old.commission_amount_minor, old.customer_total_minor,
         old.professional_plan_snapshot, old.commission_rule_id, old.country, old.currency, old.accepted_at) then
    raise exception 'Commercial booking snapshots are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_snapshot_immutable on public.bookings;
create trigger bookings_snapshot_immutable before update on public.bookings
for each row execute function public.prevent_booking_snapshot_changes();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  provider_id text not null,
  external_payment_id text,
  idempotency_key text not null unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency public.currency_code not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'partially_refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, external_payment_id)
);

create index if not exists payments_booking_idx on public.payments (booking_id, created_at desc);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  external_event_id text not null,
  payment_id uuid references public.payments(id) on delete restrict,
  event_type text not null,
  payload_digest text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (provider_id, external_event_id)
);

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.professional_subscriptions(id) on delete restrict,
  provider_id text not null,
  external_payment_id text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency public.currency_code not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  created_at timestamptz not null default now(),
  unique (provider_id, external_payment_id)
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.professional_subscriptions(id) on delete restrict,
  provider_id text not null,
  external_event_id text not null,
  event_type text not null,
  payload_digest text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (provider_id, external_event_id)
);

create table if not exists public.commercial_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  target_type text not null,
  target_id text,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

-- RLS for every exposed commercial table. Financial writes are service-side only.
alter table public.platform_commercial_settings enable row level security;
alter table public.professional_plan_prices enable row level security;
alter table public.commission_rules enable row level security;
alter table public.professional_subscriptions enable row level security;
alter table public.professional_entitlements enable row level security;
alter table public.service_requests enable row level security;
alter table public.service_quotes enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.subscription_events enable row level security;
alter table public.commercial_audit_logs enable row level security;

create policy "Published plan prices are readable" on public.professional_plan_prices
for select to anon, authenticated using (true);

create policy "Clients read their requests" on public.service_requests
for select to authenticated using (client_id = (select auth.uid()));
create policy "Professionals read open requests in their market" on public.service_requests
for select to authenticated using (
  status in ('open', 'quoted') and exists (
    select 1 from public.profiles p
    join public.professional_profiles pp on pp.user_id = p.id
    where p.id = (select auth.uid()) and p.role = 'professional'
      and p.country = service_requests.country and pp.category_slug = service_requests.category_slug
  )
);
create policy "Clients create their own requests" on public.service_requests
for insert to authenticated with check (
  client_id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'client'
      and p.country = service_requests.country and p.city = service_requests.city
  )
);

create policy "Request parties read quotes" on public.service_quotes
for select to authenticated using (
  professional_id = (select auth.uid()) or exists (
    select 1 from public.service_requests r
    where r.id = service_quotes.request_id and r.client_id = (select auth.uid())
  )
);
create policy "Professionals quote matching open requests" on public.service_quotes
for insert to authenticated with check (
  professional_id = (select auth.uid()) and status = 'sent' and exists (
    select 1 from public.service_requests r
    join public.professional_profiles pp on pp.user_id = (select auth.uid())
    join public.profiles p on p.id = pp.user_id
    where r.id = request_id and r.status in ('open', 'quoted')
      and pp.status = 'published' and pp.category_slug = r.category_slug
      and p.country = r.country and r.currency = (
        case when p.country = 'BR' then 'BRL'::public.currency_code else 'ARS'::public.currency_code end
      )
  )
);

create policy "Booking parties read bookings" on public.bookings
for select to authenticated using (client_id = (select auth.uid()) or professional_id = (select auth.uid()));
create policy "Subscription owner reads own subscription" on public.professional_subscriptions
for select to authenticated using (professional_id = (select auth.uid()));
create policy "Entitlement owner reads own benefits" on public.professional_entitlements
for select to authenticated using (professional_id = (select auth.uid()));
create policy "Payment parties read payment status" on public.payments
for select to authenticated using (exists (
  select 1 from public.bookings b where b.id = booking_id
    and (b.client_id = (select auth.uid()) or b.professional_id = (select auth.uid()))
));
create policy "Subscriber reads own subscription payments" on public.subscription_payments
for select to authenticated using (exists (
  select 1 from public.professional_subscriptions s where s.id = subscription_id
    and s.professional_id = (select auth.uid())
));

revoke all on public.platform_commercial_settings, public.professional_plan_prices,
  public.commission_rules, public.professional_subscriptions, public.professional_entitlements,
  public.service_requests, public.service_quotes, public.bookings, public.payments,
  public.payment_events, public.subscription_payments, public.subscription_events,
  public.commercial_audit_logs from anon, authenticated;
grant select on public.professional_plan_prices to anon, authenticated;
grant select, insert on public.service_requests to authenticated;
grant select, insert on public.service_quotes to authenticated;
grant select on public.bookings, public.professional_subscriptions, public.professional_entitlements,
  public.payments, public.subscription_payments to authenticated;

create or replace function public.accept_service_quote(p_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_quote public.service_quotes%rowtype;
  v_request public.service_requests%rowtype;
  v_plan text := 'free';
  v_rate integer := 0;
  v_rule uuid;
  v_fee bigint := 0;
  v_booking uuid;
  v_settings public.platform_commercial_settings%rowtype;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select * into v_quote from public.service_quotes where id = p_quote_id for update;
  if not found or v_quote.status <> 'sent' then raise exception 'Quote is unavailable'; end if;
  select * into v_request from public.service_requests where id = v_quote.request_id for update;
  if not found or v_request.client_id <> v_uid or v_request.status not in ('open', 'quoted') then
    raise exception 'Request cannot accept this quote';
  end if;
  if v_quote.valid_until is not null and v_quote.valid_until <= now() then
    raise exception 'Quote has expired';
  end if;
  if v_quote.currency <> v_request.currency then raise exception 'Currency mismatch'; end if;

  if exists (
    select 1 from public.professional_subscriptions s
    join public.professional_plan_prices pp on pp.id = s.plan_price_id
    where s.professional_id = v_quote.professional_id and pp.plan_code = 'plus'
      and s.status in ('trialing', 'active') and (s.current_period_end is null or s.current_period_end > now())
  ) or exists (
    select 1 from public.professional_entitlements e
    where e.professional_id = v_quote.professional_id and e.entitlement_code = 'plus'
      and e.starts_at <= now() and e.ends_at > now()
  ) then
    v_plan := 'plus';
  end if;

  select * into v_settings from public.platform_commercial_settings where id = true;
  if v_settings.launch_mode = 'commercial' and v_settings.commission_enabled then
    select cr.id, cr.rate_bps into v_rule, v_rate
    from public.commission_rules cr
    where cr.country = v_request.country and cr.plan_code = v_plan
      and (cr.category_slug = v_request.category_slug or cr.category_slug is null)
      and cr.valid_from <= now() and (cr.valid_until is null or cr.valid_until > now())
    order by (cr.category_slug is not null) desc, cr.valid_from desc
    limit 1;
    if not found then raise exception 'No active commission rule for this market'; end if;
  end if;

  v_fee := ((v_quote.amount_minor::numeric * v_rate) / 10000)::bigint;
  insert into public.bookings (
    request_id, quote_id, client_id, professional_id, service_amount_minor,
    commission_rate_bps, commission_amount_minor, customer_total_minor,
    professional_plan_snapshot, commission_rule_id, country, currency, status
  ) values (
    v_request.id, v_quote.id, v_uid, v_quote.professional_id, v_quote.amount_minor,
    v_rate, v_fee, v_quote.amount_minor + v_fee, v_plan, v_rule,
    v_request.country, v_request.currency, 'pending_payment'
  ) returning id into v_booking;

  update public.service_quotes set status = 'accepted', updated_at = now() where id = v_quote.id;
  update public.service_requests set status = 'booked', updated_at = now() where id = v_request.id;
  return v_booking;
end;
$$;

revoke all on function public.accept_service_quote(uuid) from public, anon;
grant execute on function public.accept_service_quote(uuid) to authenticated;

create or replace function public.set_commercial_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_service_requests_updated_at on public.service_requests;
create trigger set_service_requests_updated_at before update on public.service_requests
for each row execute function public.set_commercial_updated_at();
drop trigger if exists set_service_quotes_updated_at on public.service_quotes;
create trigger set_service_quotes_updated_at before update on public.service_quotes
for each row execute function public.set_commercial_updated_at();
drop trigger if exists set_professional_subscriptions_updated_at on public.professional_subscriptions;
create trigger set_professional_subscriptions_updated_at before update on public.professional_subscriptions
for each row execute function public.set_commercial_updated_at();
drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments
for each row execute function public.set_commercial_updated_at();
