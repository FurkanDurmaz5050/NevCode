-- Faz 2: Remotion render output için public storage bucket.
-- Generic webhook render server'ı dosyayı bu bucket'a yükleyebilir; Lambda zaten kendi S3'ünü kullanır.

insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Public okuma policy'si
create policy "videos public read"
on storage.objects for select
using (bucket_id = 'videos');

-- Service role yazabilsin (default zaten var, açıkça ekliyoruz)
create policy "videos service write"
on storage.objects for insert
with check (bucket_id = 'videos');

create policy "videos service update"
on storage.objects for update
using (bucket_id = 'videos');
