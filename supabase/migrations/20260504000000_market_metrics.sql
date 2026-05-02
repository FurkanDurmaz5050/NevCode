-- Niceliksel pazar metrikleri için JSONB kolon
alter table public.markets
  add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.markets
  add column if not exists sources jsonb default '[]'::jsonb;
