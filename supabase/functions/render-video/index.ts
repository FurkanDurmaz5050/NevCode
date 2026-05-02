// supabase/functions/render-video
// Akış:
//   1) {market_id} ile market + business + analysis(scraped_context) yükle
//   2) OpenAI ile İŞLETMEYE ÖZEL tam storyboard üret (hook, sahneler, voice-over, CTA, hashtag)
//   3) videos.script + videos.props persist (queued)
//   4) Renderer tetikle:
//      - REMOTION_LAMBDA_FUNCTION_NAME + REMOTION_SERVE_URL varsa Lambda
//      - REMOTION_RENDER_WEBHOOK varsa webhook
//      - İkisi de yoksa: status="preview" (UI storyboard'u inline gösterir, MP4 yok)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { renderMediaOnLambda } from "https://esm.sh/@remotion/lambda-client@4.0.300";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { getAuthUser, assertBusinessOwner } from "../_shared/auth.ts";

interface Req {
  market_id: string;
  composition?: "ProductHero" | "MarketSpotlight" | "SocialReel";
  product_image_url?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.5";
const OPENAI_FALLBACK_MODEL = "gpt-5.5";

const LAMBDA_FN = Deno.env.get("REMOTION_LAMBDA_FUNCTION_NAME");
const SERVE_URL = Deno.env.get("REMOTION_SERVE_URL");
const AWS_REGION = Deno.env.get("AWS_REGION") ?? "eu-central-1";
const RENDER_WEBHOOK = Deno.env.get("REMOTION_RENDER_WEBHOOK");
const RENDER_WEBHOOK_TOKEN = Deno.env.get("REMOTION_RENDER_WEBHOOK_TOKEN");
const RENDER_CALLBACK_SECRET = Deno.env.get("RENDER_CALLBACK_SECRET") ?? "";
const PUBLIC_FUNCTIONS_URL =
  Deno.env.get("PUBLIC_FUNCTIONS_URL") ?? `${SUPABASE_URL}/functions/v1`;

const LANG_MAP: Record<string, { code: string; name: string }> = {
  Almanya: { code: "DE", name: "Almanca" },
  Hollanda: { code: "NL", name: "Felemenkçe" },
  BAE: { code: "AR", name: "Arapça" },
  "Birleşik Arap Emirlikleri": { code: "AR", name: "Arapça" },
  "Suudi Arabistan": { code: "AR", name: "Arapça" },
  Japonya: { code: "JA", name: "Japonca" },
  İngiltere: { code: "EN", name: "İngilizce" },
  "Birleşik Krallık": { code: "EN", name: "İngilizce" },
  İsveç: { code: "SV", name: "İsveççe" },
  ABD: { code: "EN", name: "İngilizce" },
  Fransa: { code: "FR", name: "Fransızca" },
  İspanya: { code: "ES", name: "İspanyolca" },
  İtalya: { code: "IT", name: "İtalyanca" },
  Çin: { code: "ZH", name: "Çince" },
  "Güney Kore": { code: "KO", name: "Korece" },
};

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);

  let body: Req;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz JSON" }, 400);
  }
  if (!body.market_id) return json({ error: "market_id zorunlu" }, 400);

  const auth = await getAuthUser(req);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const composition = body.composition ?? "MarketSpotlight";
  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1) market + business + scraped_context
  const { data: market, error: mErr } = await supa
    .from("markets")
    .select("*, analyses!inner(id, business_id, scraped_context, businesses:business_id(*))")
    .eq("id", body.market_id)
    .single();
  if (mErr || !market) return json({ error: `market: ${mErr?.message}` }, 404);
  const business = (market as any).analyses?.businesses;
  const scraped = (market as any).analyses?.scraped_context ?? {};
  if (!business) return json({ error: "business bulunamadı" }, 404);
  try {
    await assertBusinessOwner(supa, business.id, auth.user_id);
  } catch (e) {
    if (e instanceof Response) return json({ error: "forbidden" }, e.status);
    throw e;
  }

  // 2) Tam storyboard
  const lang = LANG_MAP[market.country] ?? { code: "EN", name: "İngilizce" };
  let script: any;
  try {
    script = await generateStoryboard({
      composition,
      business,
      scraped,
      market,
      languageCode: lang.code,
      languageName: lang.name,
    });
  } catch (e) {
    return json({ error: `storyboard üretimi: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }

  const fallbackImage = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80";
  const candidate = body.product_image_url || scraped?.website?.ogImage || fallbackImage;
  let productImageUrl = candidate;
  try {
    const head = await fetch(candidate, { method: "GET", redirect: "follow" });
    if (!head.ok || !(head.headers.get("content-type") ?? "").startsWith("image/")) {
      productImageUrl = fallbackImage;
    }
  } catch {
    productImageUrl = fallbackImage;
  }

  const props = {
    composition,
    brandName: business.name || business.product_name || "Markanız",
    productName: business.product_name || business.category || "Ürününüz",
    productImageUrl,
    marketCountry: market.country,
    marketFlag: market.flag ?? "🌍",
    marketplaces: (market.marketplaces ?? []).slice(0, 4),
    accentColor: composition === "SocialReel" ? "#8b5cf6" : "#10b981",
    language: lang.code,
    hook: script.hook,
    cta: script.cta,
    bullets: (script.scenes ?? []).slice(0, 4).map((s: any) => s.caption ?? s.voiceover ?? ""),
    scenes: script.scenes,
    duration_seconds: durationOf(composition),
  };

  // 3) videos satırı
  const { data: vid, error: vErr } = await supa
    .from("videos")
    .insert({
      business_id: business.id,
      market_id: market.id,
      composition,
      language: lang.code,
      duration_seconds: durationOf(composition),
      hook: script.hook,
      cta: script.cta,
      script,
      props,
      status: "queued",
    })
    .select()
    .single();
  if (vErr || !vid) return json({ error: `videos insert: ${vErr?.message}` }, 500);

  // 4) Renderer tetikle
  const callbackSuffix = RENDER_CALLBACK_SECRET ? `&secret=${encodeURIComponent(RENDER_CALLBACK_SECRET)}` : "";
  const callbackUrl = `${PUBLIC_FUNCTIONS_URL}/render-callback?video_id=${vid.id}${callbackSuffix}`;
  let renderId: string | null = null;
  let triggered = false;
  let triggerError: string | null = null;
  let triggerMode: string = "none";

  if (LAMBDA_FN && SERVE_URL) {
    try {
      renderId = await triggerLambda(composition, props, callbackUrl);
      triggered = true;
      triggerMode = "lambda";
    } catch (e) {
      triggerError = `lambda: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  if (!triggered && RENDER_WEBHOOK) {
    try {
      const res = await fetch(RENDER_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(RENDER_WEBHOOK_TOKEN
            ? { Authorization: `Bearer ${RENDER_WEBHOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          video_id: vid.id,
          composition,
          props,
          callback_url: callbackUrl,
        }),
      });
      if (!res.ok) {
        triggerError = `webhook ${res.status}: ${await res.text()}`;
      } else {
        const j = await res.json().catch(() => ({}));
        renderId = j.render_id ?? null;
        triggered = true;
        triggerMode = "webhook";
      }
    } catch (e) {
      triggerError = `webhook: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  if (triggered) {
    await supa
      .from("videos")
      .update({ status: "rendering", render_id: renderId, progress: 5 })
      .eq("id", vid.id);
    return json({ video_id: vid.id, render_id: renderId, composition, language: lang.code, status: "rendering", mode: triggerMode });
  }

  // Renderer yok → preview modu
  await supa
    .from("videos")
    .update({
      status: "preview",
      progress: 100,
      error: triggerError ??
        "MP4 renderer (Remotion Lambda / webhook) tanımlı değil — storyboard preview olarak kaydedildi.",
      ready_at: new Date().toISOString(),
    })
    .eq("id", vid.id);

  return json({
    video_id: vid.id,
    composition,
    language: lang.code,
    status: "preview",
    note:
      "Renderer config yok. supabase/functions/.env içine REMOTION_LAMBDA_FUNCTION_NAME+REMOTION_SERVE_URL ya da REMOTION_RENDER_WEBHOOK ekle. Storyboard üretildi ve panelde gösteriliyor.",
    script,
  });
});

function durationOf(comp: string): number {
  if (comp === "ProductHero") return 15;
  if (comp === "SocialReel") return 20;
  return 30;
}

const STORYBOARD_SYSTEM = `Sen GlobalNest video stüdyosunun baş senaryo yazarısın.
Türk KOBİ'leri için yurtdışı pazarlara özel kısa pazarlama videosu storyboard'u üretiyorsun.
HER storyboard:
 - Tamamen seçilen pazarın diline çevrilmiş olmalı (sahnelerin caption ve voiceover alanları)
 - İşletmenin GERÇEK ürün/kategori/değer önerisine, web sitesinden çıkan başlıklara ve seçilen pazarın özelliklerine (rekabet, kargo modu, marketplace'ler, vergi, düzenlemeler) atıf yapmalı
 - Genel klişe değil, KİŞİSELLEŞTİRİLMİŞ olmalı (markanın adı, ürün adı, sektörel kanıtlar)
 - 4-6 sahneye bölünmeli, sahne süreleri toplamı duration_target ile uyumlu olmalı

Sadece geçerli JSON döndür, açıklama yok. Şema:
{
  "language_code": "DE",
  "language_name": "Almanca",
  "hook": "İlk 3 saniye, hedef dilde, dikkat çekici 6-10 kelime",
  "value_props": ["3 madde, hedef dilde, ürünün lokal pazarda neden farklı olduğunu söyler"],
  "scenes": [
    {
      "index": 1,
      "title_tr": "Türkçe sahne adı (editör notu)",
      "duration_seconds": 4,
      "voiceover": "Hedef dilde 1-2 cümle voice-over",
      "caption": "Hedef dilde ekran alt yazısı (kısa)",
      "visual": "Sahne için görsel/animasyon önerisi (Türkçe, prodüksiyon notu)"
    }
  ],
  "cta": "Hedef dilde net bir CTA cümlesi",
  "cta_link_text": "Buton üzerine yazılacak kısa metin (hedef dilde, max 3 kelime)",
  "hashtags": ["#hedef_dilde", "#yerel_pazar", "#marka"],
  "tone": "Bu pazara uygun ton (örn: 'minimal-professional', 'warm-storytelling', 'high-energy reels')",
  "compliance_notes": ["Bu pazarda dikkat edilecek regülasyon/etiket notu (Türkçe, editör için)"]
}`;

async function generateStoryboard(opts: {
  composition: string;
  business: any;
  scraped: any;
  market: any;
  languageCode: string;
  languageName: string;
}): Promise<any> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY tanımlı değil");

  const dur = durationOf(opts.composition);
  const ratio = opts.composition === "SocialReel" ? "9:16 dikey (Reels/TikTok)" : "16:9 yatay (YouTube/LinkedIn)";

  const userPrompt = `# Video brief
- Composition: ${opts.composition} (${ratio})
- Toplam süre: ${dur} saniye
- Hedef dil: ${opts.languageName} (${opts.languageCode})

# İşletme (gerçek müşteri)
- Marka: ${opts.business.name ?? "(isim yok)"}
- Ürün: ${opts.business.product_name ?? "?"}
- Kategori: ${opts.business.category ?? "?"}
- Web: ${opts.business.website ?? "?"}
- Instagram: @${opts.business.instagram ?? "?"}
- Açıklama / hikaye: ${opts.business.idea ?? "(yok)"}
- Birim maliyet: ${opts.business.unit_cost_try ?? "?"} TRY
- Ürün ağırlığı: ${opts.business.weight_kg ?? "?"} kg

# Web sitesinden çıkan kanıt
- Title: ${opts.scraped?.website?.title ?? "-"}
- Description: ${opts.scraped?.website?.description ?? "-"}
- Başlıklar: ${(opts.scraped?.website?.headings ?? []).slice(0, 8).join(" | ") || "-"}
- Anahtar kelimeler: ${(opts.scraped?.website?.detectedKeywords ?? []).slice(0, 12).join(", ") || "-"}
- Metin örneği: ${(opts.scraped?.website?.textSnippet ?? "").slice(0, 800)}

# Hedef pazar
- Ülke: ${opts.market.country} ${opts.market.flag ?? ""}
- Uyum skoru: ${opts.market.fit_score}/100
- Marketplace'ler: ${(opts.market.marketplaces ?? []).join(", ") || "-"}
- Rekabet: ${opts.market.competition} | Talep: ${opts.market.est_demand}
- Ortalama marj: %${opts.market.avg_margin}
- Kargo: ${opts.market.shipping_mode}, ${opts.market.shipping_days} gün, ${opts.market.shipping_cost_per_kg} USD/kg
- Karbon: ${opts.market.carbon_kg_per_kg} kgCO₂/kg
- Vergi notu: ${opts.market.tax_note ?? "-"}
- Para birimi: ${opts.market.currency}
- Rakipler: ${(opts.market.competitors ?? []).join(", ") || "-"}
- Düzenlemeler: ${(opts.market.regulations ?? []).join(", ") || "-"}
- AI gerekçesi: ${opts.market.rationale ?? "-"}

Yukarıdaki TÜM bilgileri kullanarak ${opts.languageName} dilinde, ${opts.market.country} pazarına ÖZGÜ bir storyboard üret.
Genel ifadeler değil; markanın gerçek adını, ürün adını, web sitesinin söz ettiği değer önerisini, hedef pazarın spesifik marketplace'lerini ve regülasyonlarını storyboard'a göm.
JSON şemasına birebir uy. Sadece JSON döndür.`;

  const tryModel = async (model: string) => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: STORYBOARD_SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${model} ${res.status}: ${t.slice(0, 200)}`);
    }
    const j = await res.json();
    const raw = j.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(raw);
  };

  try {
    return await tryModel(OPENAI_MODEL);
  } catch (e) {
    console.warn("storyboard primary model fail, fallback:", e);
    return await tryModel(OPENAI_FALLBACK_MODEL);
  }
}

async function triggerLambda(
  composition: string,
  inputProps: Record<string, unknown>,
  webhookUrl: string,
): Promise<string> {
  if (!LAMBDA_FN || !SERVE_URL) {
    throw new Error("REMOTION_LAMBDA_FUNCTION_NAME ve REMOTION_SERVE_URL gerekli");
  }
  if (!Deno.env.get("AWS_ACCESS_KEY_ID") || !Deno.env.get("AWS_SECRET_ACCESS_KEY")) {
    throw new Error("AWS_ACCESS_KEY_ID ve AWS_SECRET_ACCESS_KEY gerekli");
  }

  const out = await renderMediaOnLambda({
    region: AWS_REGION as any,
    functionName: LAMBDA_FN,
    serveUrl: SERVE_URL,
    composition,
    inputProps,
    codec: "h264",
    imageFormat: "jpeg",
    framesPerLambda: 9999,
    privacy: "public",
    maxRetries: 1,
    webhook: webhookUrl
      ? { url: webhookUrl, secret: RENDER_CALLBACK_SECRET || null }
      : undefined,
  });
  return out.renderId;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
