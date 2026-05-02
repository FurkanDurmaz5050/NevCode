-- videos.script: tam senaryo (hook, scenes, voiceover, CTA, hashtags)
alter table public.videos add column if not exists script jsonb;
alter table public.videos add column if not exists props jsonb;

-- "preview" status (renderer config yokken bile saklanır)
-- mevcut check constraint olmadığı için ekstra DDL gerekmez.

comment on column public.videos.script is 'Full multilingual storyboard tailored to business + market';
comment on column public.videos.props is 'Remotion inputProps payload for client-side preview';
