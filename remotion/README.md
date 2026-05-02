# NevCode Remotion Renderer

Bu paket iki şekilde çalışır:

1. **Local renderer** — `pnpm server` ile bilgisayarınızda Express ayağa kalkar; Edge function `host.docker.internal:5174/render` adresine webhook atar. Geliştirme için pratik.
2. **AWS Lambda** — production. Render iş yükü AWS Lambda'da paralel çalışır, MP4 doğrudan S3'e yazılır, callback Supabase'i günceller.

Aynı kod tabanı her iki yolu da destekler. `render-video` edge function önce Lambda env'lerini, sonra webhook env'ini kontrol eder; ikisi de yoksa "preview" moduna düşer.

---

## Compositions

| ID | Süre | Çözünürlük | Kullanım |
| --- | --- | --- | --- |
| `ProductHero` | 15s | 1920×1080 | Ürün vitrini |
| `MarketSpotlight` | 30s | 1920×1080 | Pazar odaklı tanıtım |
| `SocialReel` | 20s | 1080×1920 | Reels/TikTok dikey |

---

## Local renderer (geliştirme)

```bash
cd remotion
pnpm install
pnpm server   # http://localhost:5174
```

Edge function `.env`'inde:

```
REMOTION_RENDER_WEBHOOK=http://host.docker.internal:5174/render
REMOTION_RENDER_WEBHOOK_TOKEN=opsiyonel-bearer
```

`pnpm server` MP4'i Supabase Storage'a (lokal) yükler ve callback'i çağırır.

---

## AWS Lambda (production)

### 1) IAM user

```bash
pnpm lambda:policy   # gereken IAM policy JSON'ını yazdırır
```

Çıktıyı **AWS Console → IAM → Policies → Create policy → JSON** olarak yapıştırıp programmatic-access user'a attach et. Access key oluştur.

### 2) Yerel env

```bash
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=eu-central-1
export REMOTION_SITE_NAME=globalnest
```

### 3) Function + Site deploy

```bash
pnpm lambda:deploy
```

1. Lambda function'ını deploy eder (3008 MB, 240s, 2 GB disk)
2. `src/index.ts`'i bundle'lar, S3'e upload eder, serve URL döner
3. `supabase secrets set ...` komutlarını ekrana yazar

Çıktının altındaki komutları kopyalayıp çalıştırın. Ek olarak:

```bash
supabase secrets set RENDER_CALLBACK_SECRET=$(openssl rand -hex 16)
```

### 4) Smoke test

```bash
export REMOTION_SERVE_URL=...
export REMOTION_LAMBDA_FUNCTION_NAME=...
pnpm lambda:test
```

Beklenen çıktı: `Done: s3://.../out.mp4`

### 5) Edge function nasıl çağırıyor?

`render-video` edge fn SigV4 imzalı POST atar:

```
POST https://lambda.${AWS_REGION}.amazonaws.com/2015-03-31/functions/${FN}/invocations
Body: { type:"start", serveUrl, composition, inputProps, codec:"h264", framesPerLambda:80, region, privacy:"public", webhook:{url,secret} }
```

Lambda webhook tamamlanınca `{ type:"success", outputUrl, ... }` payload'unu `render-callback`'e POST eder. Callback `?secret=...` query param'ını `RENDER_CALLBACK_SECRET` ile karşılaştırır.

---

## Maliyet (yaklaşık)

- 30s 1080p MP4 ≈ 1500 frame, 80 frames/lambda → 19 invocation × ~12s ≈ **$0.012/video**
- S3 storage ~$0.023/GB/ay; 30s MP4 ~5–10 MB → ihmal edilebilir
- İlk render bundle upload nedeniyle yavaştır; sonraki render'lar 30–60s

---

## Sorun giderme

| Belirti | Çözüm |
| --- | --- |
| `lambda invoke 403 InvalidSignature` | Saat senkron, `AWS_*` doğru mu? |
| `lambda invoke 404 ResourceNotFoundException` | `REMOTION_LAMBDA_FUNCTION_NAME` yanlış |
| `Error: serveUrl invalid` | `pnpm lambda:sites:deploy` tekrar çalıştır |
| Webhook gelmiyor | `RENDER_CALLBACK_SECRET` Lambda webhook secret'ı ile aynı mı? |

---

## Env özeti

| Değişken | Açıklama |
| --- | --- |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM user |
| `AWS_REGION` | Default `eu-central-1` |
| `REMOTION_LAMBDA_FUNCTION_NAME` | `lambda:functions:deploy` çıktısı |
| `REMOTION_SERVE_URL` | `lambda:sites:deploy` çıktısı |
| `RENDER_CALLBACK_SECRET` | `openssl rand -hex 16` |
| `REMOTION_RENDER_WEBHOOK` | (lokal) `http://host.docker.internal:5174/render` |
| `REMOTION_RENDER_WEBHOOK_TOKEN` | (lokal opsiyonel) Bearer |
| `RENDER_PORT` | (lokal) Default 5174 |
