-- Sosyal medya / pazaryeri post yapıtları (her market için çoklu)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  market_id uuid references public.markets(id) on delete set null,
  channel text not null default 'instagram',  -- instagram | facebook | tiktok | linkedin | x | amazon | etsy
  language text,                                -- DE, EN, FR, ...
  status text not null default 'queued',        -- queued | generating | ready | failed
  caption text,
  hashtags jsonb default '[]'::jsonb,
  cta text,
  image_storage_path text,
  image_url text,
  prompt text,
  meta jsonb,                                   -- model bilgisi, vs.
  error text,
  created_at timestamptz not null default now(),
  ready_at timestamptz
);
create index on public.posts (business_id, created_at desc);
create index on public.posts (market_id, created_at desc);
alter table public.posts disable row level security;

-- Görsel/post bucket'ı
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do update set public = true;

create policy "posts public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'posts');
create policy "posts insert"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'posts');
create policy "posts update"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'posts');
