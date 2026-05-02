# GlobalNest

KOBİ'lerin yurtdışı pazarlara akıllı ve otomatik açılmasını sağlayan AI platformu.
İşletmeyi tanı → uygun pazarları bul → her pazar için reklam videosu + sosyal post üret
→ FX / kargo / karbon analizi → AI ajan ile canlı destek.

```
                ┌────────────────────────┐
                │  Vercel — Vite + React │
                │  (Figma UI)            │
                └─────────┬──────────────┘
                          │ JWT
                          ▼
   ┌─────────────────────────────────────────┐
   │ Supabase                                │
   │  ├─ Postgres + RLS  (auth.uid scoped)   │
   │  ├─ Auth (email + Google OAuth)         │
   │  ├─ Storage (videos, posts public read) │
   │  └─ Edge Functions (Deno)               │
   │     ├ deep-research  ⇄ Tavily + OpenAI  │
   │     ├ research-search ⇄ Tavily          │
   │     ├ social-posts   ⇄ OpenAI + Gemini  │
   │     ├ render-video   ⇄ AWS Lambda       │
   │     ├ render-callback ◀ Lambda webhook  │
   │     ├ scrape-context, fx-forecast,      │
   │     │   shipping-quote, carbon-estimate │
   │     └ openai-chat, gemini-image, health │
   └─────────────────┬───────────────────────┘
                     │ SigV4
                     ▼
            ┌──────────────────────┐
            │ AWS Lambda + S3      │
            │ (Remotion renderer)  │
            └──────────────────────┘
```

## Hızlı başlangıç (lokal)

```bash
# 1) Supabase lokal stack
brew install supabase/tap/supabase
supabase start            # 127.0.0.1:54321 ayağa kalkar

# 2) DB migration + seed
supabase db reset

# 3) Edge fn secret'ları
cp supabase/functions/.env.example supabase/functions/.env
# OPENAI_API_KEY, GEMINI_API_KEY, TAVILY_API_KEY... doldur

# 4) Edge fn'leri serve et
supabase functions serve --env-file supabase/functions/.env

# 5) Frontend
cd "Figma UI"
cp .env.production.example .env.local
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=$(supabase status -o json | jq -r .ANON_KEY)
pnpm install && pnpm dev   # http://localhost:5173

# 6) (Opsiyonel) Lokal video renderer
cd ../remotion
pnpm install && pnpm server   # http://localhost:5174
```

## Env değişkenleri

### Frontend (`Figma UI/.env.local`)

| Değişken | Açıklama |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key |

### Edge functions (`supabase/functions/.env` veya `supabase secrets set`)

| Değişken | Zorunlu mu? | Açıklama |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✓ | gpt-5.5 |
| `OPENAI_MODEL` | – | Default `gpt-5.5` |
| `GEMINI_API_KEY` | ✓ (post görseli) | `gemini-2.5-flash-image` |
| `TAVILY_API_KEY` | – | Web araması; yoksa atlanır |
| `RENDER_CALLBACK_SECRET` | ✓ (Lambda) | Webhook imza doğrulaması |
| `PUBLIC_FUNCTIONS_URL` | ✓ (Lambda) | `https://YOUR.supabase.co/functions/v1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | — | **Kullanma.** Supabase Edge Functions `AWS_*` prefix'ini reddeder; aşağıdaki `LAMBDA_AWS_*` isim alanını kullan. |
| `LAMBDA_AWS_ACCESS_KEY_ID` / `LAMBDA_AWS_SECRET_ACCESS_KEY` | – | Remotion Lambda invoke için IAM credentials |
| `LAMBDA_AWS_REGION` | – | Default `eu-central-1` |
| `REMOTION_LAMBDA_FUNCTION_NAME` | – | `pnpm lambda:functions:deploy` çıktısı |
| `REMOTION_SERVE_URL` | – | `pnpm lambda:sites:deploy` çıktısı |
| `REMOTION_RENDER_WEBHOOK` | – | Lokal renderer URL'i |
| `REMOTION_RENDER_WEBHOOK_TOKEN` | – | Lokal renderer Bearer |

## Production deploy

### 1) Supabase

```bash
export SUPABASE_PROJECT_REF=abcd1234
./scripts/deploy-supabase.sh
```

Sonra:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set TAVILY_API_KEY=tvly-...
supabase secrets set RENDER_CALLBACK_SECRET=$(openssl rand -hex 16)
```

### 2) AWS Lambda (videolar)

Bkz. [`remotion/README.md`](remotion/README.md). Özet:

```bash
cd remotion
pnpm lambda:policy   # IAM policy JSON
pnpm lambda:deploy   # function + site
pnpm lambda:test     # smoke test
```

### 3) Vercel (frontend)

```bash
cd "Figma UI"
vercel link
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel deploy --prod
```

Veya GitHub Actions ile otomatik (`.github/workflows/deploy-frontend.yml` —
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` repo secret'ları gerekir).

### 4) GitHub Actions

| Workflow | Tetik | Yaptığı |
| --- | --- | --- |
| `ci.yml` | her PR / push | Vite build + Deno typecheck |
| `deploy-supabase.yml` | `supabase/**` push | DB migration + edge fn deploy |
| `deploy-frontend.yml` | `Figma UI/**` push | Vercel prod deploy |

Repo secret'ları:

- `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Proje yapısı

```
Figma UI/                 — Vite + React + shadcn (frontend)
  src/app/lib/            — supabase client, auth, business, research, posts, videos, metrics
  src/app/auth/           — AuthGate (Login/Signup)
  src/app/components/     — ErrorBoundary + landing components
  src/app/panel/          — Panel + 11 sayfa
supabase/
  config.toml             — local stack + Google OAuth
  migrations/             — 20260502 init, 20260502030000 posts, 20260503 RLS
  functions/              — 12 edge fn + _shared/{cors,auth,tavily,aws-sigv4}.ts
remotion/                 — Remotion v4 + Lambda deploy scripts
scripts/deploy-supabase.sh
.github/workflows/        — ci, deploy-frontend, deploy-supabase
```

## Mimari notlar

- **Auth + RLS**: Tüm tablolar `businesses.user_id = auth.uid()` zincirinde RLS ile korunur.
  Edge fn'ler service-role kullanır + `_shared/auth.ts` ile JWT doğrular ve
  `assertBusinessOwner()` çağırır → kullanıcı X başkasının business_id'sini
  gönderemez.
- **Web search**: `_shared/tavily.ts` deep-research ve social-posts'a canlı
  trend/rakip verisi enjekte eder. ResearchAgent UI'inde "Web aranıyor" toggle
  vardır.
- **Video render**: edge fn → SigV4 ile AWS Lambda invoke → Lambda Remotion
  render → S3 → webhook → `render-callback` (`?secret=...` doğrulama) → DB.
- **Production guard**: `Figma UI/src/app/lib/supabase.ts` PROD build'de env
  yoksa `throw` eder — sessiz hatayı önler.

Ninth commit.
Tenth commit.
Eleventh commit.
