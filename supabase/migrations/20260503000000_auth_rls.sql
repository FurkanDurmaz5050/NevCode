-- ===================================================================
-- Faz 5: Supabase Auth + Row-Level Security (multi-tenant)
-- ===================================================================
-- - businesses.user_id eklenir (auth.users referansı)
-- - tüm tablolarda RLS açılır; kullanıcı sadece kendi business'ine
--   bağlı kayıtları görür/değiştirir
-- - edge functions service-role kullandığı için RLS'i bypass eder
--   ve insert sırasında user_id'yi business üzerinden kalıtım yoluyla
--   doğru zincirde tutar (foreign key + trigger)
-- ===================================================================

alter table public.businesses
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.businesses
  alter column owner_id drop not null;
create index if not exists businesses_user_idx on public.businesses (user_id, created_at desc);

-- ----- RLS enable -----
alter table public.businesses enable row level security;
alter table public.analyses   enable row level security;
alter table public.markets    enable row level security;
alter table public.videos     enable row level security;
alter table public.posts      enable row level security;
alter table public.calls      enable row level security;
alter table public.shipments  enable row level security;
alter table public.fx_snapshots enable row level security;

-- ----- Helper: business sahibi mi? -----
create or replace function public.is_business_owner(b_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses where id = b_id and user_id = auth.uid());
$$;
grant execute on function public.is_business_owner(uuid) to authenticated;

create or replace function public.is_analysis_owner(a_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.analyses a
      join public.businesses b on b.id = a.business_id
     where a.id = a_id and b.user_id = auth.uid()
  );
$$;
grant execute on function public.is_analysis_owner(uuid) to authenticated;

-- ----- BUSINESSES -----
drop policy if exists "biz select own" on public.businesses;
drop policy if exists "biz insert own" on public.businesses;
drop policy if exists "biz update own" on public.businesses;
drop policy if exists "biz delete own" on public.businesses;
create policy "biz select own" on public.businesses
  for select to authenticated using (user_id = auth.uid());
create policy "biz insert own" on public.businesses
  for insert to authenticated with check (user_id is null or user_id = auth.uid());
create policy "biz update own" on public.businesses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "biz delete own" on public.businesses
  for delete to authenticated using (user_id = auth.uid());

-- ----- ANALYSES -----
drop policy if exists "ana select own" on public.analyses;
drop policy if exists "ana mod own"    on public.analyses;
create policy "ana select own" on public.analyses
  for select to authenticated using (public.is_business_owner(business_id));
create policy "ana mod own" on public.analyses
  for all to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- ----- MARKETS -----
drop policy if exists "mar select own" on public.markets;
drop policy if exists "mar mod own"    on public.markets;
create policy "mar select own" on public.markets
  for select to authenticated using (public.is_analysis_owner(analysis_id));
create policy "mar mod own" on public.markets
  for all to authenticated
  using (public.is_analysis_owner(analysis_id))
  with check (public.is_analysis_owner(analysis_id));

-- ----- VIDEOS -----
drop policy if exists "vid select own" on public.videos;
drop policy if exists "vid mod own"    on public.videos;
create policy "vid select own" on public.videos
  for select to authenticated using (public.is_business_owner(business_id));
create policy "vid mod own" on public.videos
  for all to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- ----- POSTS -----
drop policy if exists "pst select own" on public.posts;
drop policy if exists "pst mod own"    on public.posts;
create policy "pst select own" on public.posts
  for select to authenticated using (public.is_business_owner(business_id));
create policy "pst mod own" on public.posts
  for all to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- ----- CALLS -----
drop policy if exists "cal select own" on public.calls;
drop policy if exists "cal mod own"    on public.calls;
create policy "cal select own" on public.calls
  for select to authenticated using (public.is_business_owner(business_id));
create policy "cal mod own" on public.calls
  for all to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- ----- SHIPMENTS -----
drop policy if exists "shp select own" on public.shipments;
drop policy if exists "shp mod own"    on public.shipments;
create policy "shp select own" on public.shipments
  for select to authenticated using (public.is_business_owner(business_id));
create policy "shp mod own" on public.shipments
  for all to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- ----- FX cache: herkes okuyabilir, yazma sadece service-role -----
drop policy if exists "fx public read" on public.fx_snapshots;
create policy "fx public read" on public.fx_snapshots
  for select to anon, authenticated using (true);

-- ----- Auto-link trigger: insert'te user_id NULL ise auth.uid() koyar -----
create or replace function public.set_business_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists businesses_set_user on public.businesses;
create trigger businesses_set_user before insert on public.businesses
  for each row execute function public.set_business_user();
