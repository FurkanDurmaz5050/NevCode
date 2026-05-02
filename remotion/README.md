# GlobalNest Remotion

KOBİ pazarlama videoları için Remotion projesi.

## Compositions

| ID | Boyut | Süre | Kullanım |
|----|-------|------|----------|
| `ProductHero` | 1920×1080 | 15sn | Ürün lansmanı / web embed |
| `MarketSpotlight` | 1920×1080 | 30sn | Pazar bazlı detaylı pitch |
| `SocialReel` | 1080×1920 | 20sn | Reels / TikTok / Shorts |

## Komutlar

```bash
pnpm studio          # interaktif önizleme (localhost:3000)
pnpm render:hero     # out/hero.mp4
pnpm render:spotlight
pnpm render:reel
pnpm lambda:deploy   # AWS Lambda + S3 site (production render)
```

## Render mimarisi

1. Frontend → Supabase `render-video` edge function
2. Edge function → Remotion Lambda **veya** generic `REMOTION_RENDER_WEBHOOK`
3. Render bittiğinde → `render-callback` edge function → `videos.url` güncellenir
