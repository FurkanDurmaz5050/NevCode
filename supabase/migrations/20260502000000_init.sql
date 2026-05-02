-- GlobalNest initial schema
-- Single-user demo (auth yok). owner_id text alanı localStorage'daki demo user id'yi tutar.
-- Faz 5'te auth.users'a foreign key'e geçilecek.

create extension if not exists "pgcrypto";

-- İşletme profili (onboarding çıktısı)
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text,
  website text,
  instagram text,
  category text,
  product_name text,
  idea text,
  unit_cost_try numeric,
  lead_time_days integer,
  weight_kg numeric default 1,
  origin_country text default 'TR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.businesses (owner_id, created_at desc);

-- Bir analiz koşusu (deep-research session)
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  status text not null default 'queued', -- queued | scraping | researching | scoring | done | error
  scraped_context jsonb,
  raw_research text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index on public.analyses (business_id, created_at desc);

-- Pazar önerileri (analiz başına 1+)
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  country text not null,
  country_code text,
  flag text,
  fit_score integer not null default 0,
  marketplaces jsonb not null default '[]'::jsonb,
  competition text,
  est_demand text,
  avg_margin numeric,
  shipping_mode text,
  shipping_days integer,
  shipping_cost_per_kg numeric,
  carbon_kg_per_kg numeric,
  tax_note text,
  rationale text,
  competitors jsonb default '[]'::jsonb,
  regulations jsonb default '[]'::jsonb,
  currency text,
  created_at timestamptz not null default now()
);
create index on public.markets (analysis_id, fit_score desc);

-- Üretilen pazarlama videoları (Remotion)
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  market_id uuid references public.markets(id) on delete set null,
  composition text not null,
  language text,
  duration_seconds integer,
  hook text,
  cta text,
  status text not null default 'queued', -- queued | rendering | ready | failed
  progress integer default 0,
  storage_path text,
  url text,
  render_id text,
  error text,
  created_at timestamptz not null default now(),
  ready_at timestamptz
);
create index on public.videos (business_id, created_at desc);

-- ElevenLabs/Twilio çağrı kayıtları
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  direction text not null, -- inbound | outbound
  from_number text,
  to_number text,
  duration_seconds integer,
  status text, -- completed | failed | no-answer | in-progress
  transcript text,
  summary text,
  outcome text,
  recording_url text,
  twilio_sid text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.calls (business_id, started_at desc);

-- Aktif sevkiyat takibi
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  market_id uuid references public.markets(id) on delete set null,
  carrier text,
  service text,
  mode text, -- air | sea | road | rail
  weight_kg numeric,
  cost numeric,
  cost_currency text default 'USD',
  carbon_kg numeric,
  estimated_days integer,
  tracking_number text,
  status text default 'created',
  created_at timestamptz not null default now()
);
create index on public.shipments (business_id, created_at desc);

-- FX cache (her gün/sorgu başına 1 kayıt)
create table public.fx_snapshots (
  id uuid primary key default gen_random_uuid(),
  base text not null,
  quote text not null,
  rate numeric not null,
  forecast jsonb, -- [{d: 'G1', v: 32.4}, ...]
  fetched_at timestamptz not null default now()
);
create index on public.fx_snapshots (base, quote, fetched_at desc);

-- updated_at trigger helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger businesses_touch before update on public.businesses
for each row execute function public.touch_updated_at();

-- RLS şimdilik kapalı (demo). Faz 5'te auth eklendiğinde owner_id = auth.uid() policy'si gelecek.
alter table public.businesses disable row level security;
alter table public.analyses disable row level security;
alter table public.markets disable row level security;
alter table public.videos disable row level security;
alter table public.calls disable row level security;
alter table public.shipments disable row level security;
alter table public.fx_snapshots disable row level security;
