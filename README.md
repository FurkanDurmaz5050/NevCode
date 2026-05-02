# GlobalNest

KOBİ'lerin yurtdışı pazarlara akıllı ve otomatik açılmasını sağlayan AI platformu:
işletmeyi tanı → uygun pazarları bul → her pazar için pazarlama videosu üret →
ElevenLabs + Twilio ile telefon destek hattı kur → FX/kargo/karbon analizleri.

## Mimari

```
Figma UI/        # Vite + React 18 + Tailwind 4 (frontend)
supabase/        # Postgres şeması + Edge Functions (backend)
  migrations/
  functions/
    openai-chat/ # OpenAI proxy (anahtar sunucuda)
```

- **Frontend**: Vite + React + Tailwind. Single-user demo (auth yok).
- **Backend**: Supabase (Postgres + Edge Functions + Storage). Tüm 3rd-party API
  key'leri **sadece** edge function secret'larında yaşar.

## Kurulum

### 1. Bağımlılıklar

```bash
brew install supabase/tap/supabase
cd "Figma UI" && pnpm install
```

### 2. Supabase local stack

Repo kökünde:

```bash
supabase start
```

### 3. Frontend env

```bash
cd "Figma UI"
cp .env.local.example .env.local
# supabase start çıktısındaki API URL + anon key ile doldur
```

### 4. Edge function secret'ları

```bash
cp supabase/functions/.env.example supabase/functions/.env
# OPENAI_API_KEY'i doldur
supabase functions serve --env-file supabase/functions/.env
```

### 5. Geliştirme

```bash
cd "Figma UI" && pnpm dev
```

## Production deploy (özet)

```bash
supabase link --project-ref <REF>
supabase db push
supabase functions deploy openai-chat
supabase secrets set --env-file supabase/functions/.env
```

## Yol Haritası

- **Faz 0** ✅ Supabase iskeleti, OpenAI proxy, schema, env güvenliği
- **Faz 1** 🚧 Onboarding → scrape → deep research → pazar listesi
- **Faz 2** ⏳ Remotion video studio (Lambda render)
- **Faz 3** ⏳ ElevenLabs + Twilio telefon hattı
- **Faz 4** ⏳ Gerçek FX/kargo/karbon API'leri
- **Faz 5** ⏳ Polish, demo, dokümantasyon

## Güvenlik

Frontend'de hiçbir 3rd-party API key bulunmaz. `VITE_*` prefix sadece
Supabase URL ve **anon** key için. Tüm dış servis çağrıları edge function
proxy'leri üzerinden gider.

Sixth commit.

Seventh commit.
