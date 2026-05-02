// supabase/functions/social-posts
// Bir market için sosyal medya/pazaryeri postları üretir:
//   1) market + business + scraped_context yükle, target dili tespit et
//   2) Her kanal için OpenAI ile JSON post üret (caption + hashtags + cta + image_prompt)
//   3) gemini-image fonksiyonunu çağırıp görseli üret + Supabase Storage 'posts' bucket'ına yükle
//   4) posts tablosuna kaydet
//
// Body: { market_id, channels?: string[], language?: string, regenerate?: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { getAuthUser, assertBusinessOwner } from "../_shared/auth.ts";
import { tavilySearch, formatResults, hasTavily } from "../_shared/tavily.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.5";
const OPENAI_FALLBACK_MODEL = "gpt-4o-mini";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-2.5-flash-image";

const LANG_MAP: Record<string, { code: string; name: string }> = {
  Almanya: { code: "DE", name: "Almanca" },
  Hollanda: { code: "NL", name: "Felemenkçe" },
  BAE: { code: "AR", name: "Arapça" },
  "Birleşik Arap Emirlikleri": { code: "AR", name: "Arapça" },
  "Suudi Arabistan": { code: "AR", name: "Arapça" },
  Japonya: { code: "JA", name: "Japonca" },
  İngiltere: { code: "EN", name: "İngilizce" },
  ABD: { code: "EN", name: "İngilizce" },
  Fransa: { code: "FR", name: "Fransızca" },
  İspanya: { code: "ES", name: "İspanyolca" },
  İtalya: { code: "IT", name: "İtalyanca" },
  Çin: { code: "ZH", name: "Çince" },
  "Güney Kore": { code: "KO", name: "Korece" },
  İsveç: { code: "SV", name: "İsveççe" },
};

const ASPECT: Record<string, string> = {
  instagram: "1:1",
  facebook: "1:1",
  tiktok: "9:16",
  linkedin: "1:1",
  x: "16:9",
  amazon: "1:1",
  etsy: "1:1",
};

interface Req {
  market_id: string;
  channels?: string[];
  language?: string;
  regenerate?: boolean;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);
  if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY tanımlı değil" }, 500);

  let body: Req;
  try { body = await req.json(); } catch { return json({ error: "Geçersiz JSON" }, 400); }
  if (!body.market_id) return json({ error: "market_id zorunlu" }, 400);

  const auth = await getAuthUser(req);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const channels = (body.channels && body.channels.length > 0)
    ? body.channels
    : ["instagram", "tiktok", "facebook"];

  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
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

  const lang = body.language
    ? { code: body.language, name: body.language }
    : (LANG_MAP[market.country] ?? { code: "EN", name: "İngilizce" });

  const productImageUrl: string | undefined =
    scraped?.website?.ogImage ?? scraped?.website?.images?.[0];

  // Trending hashtag/topic araştırması (opsiyonel — sadece Tavily varsa)
  let trending = "";
  if (hasTavily()) {
    try {
      const cat = business.category ?? business.product_name ?? "product";
      const { results, answer } = await tavilySearch(
        `trending hashtags and viral content topics for ${cat} in ${market.country} 2026`,
        { max_results: 5, search_depth: "basic", include_answer: true, topic: "general" },
      );
      trending = [answer ? `Answer: ${answer}` : "", formatResults(results, 200)].filter(Boolean)
        .join("\n");
    } catch (e) {
      console.warn("[social-posts] trending arama atlanıyor", e);
    }
  }

  const created: any[] = [];
  for (const channel of channels) {
    try {
      // posts row pending
      const { data: row, error: insErr } = await supa
        .from("posts")
        .insert({
          business_id: business.id,
          market_id: market.id,
          channel,
          language: lang.code,
          status: "generating",
        })
        .select()
        .single();
      if (insErr || !row) throw new Error(`posts insert: ${insErr?.message}`);

      const post = await generatePost({
        channel, business, scraped, market,
        languageCode: lang.code, languageName: lang.name,
        trending,
      });

      // Görsel üret + posts bucket'ına yükle (Gemini'yi doğrudan çağır, edge fn içi HTTP yok)
      const aspect = ASPECT[channel] ?? "1:1";
      const storagePath = `${business.id}/${market.id}/${channel}-${row.id}.png`;
      const img = await generateGeminiImage({
        prompt: post.image_prompt,
        referenceUrl: productImageUrl,
        aspect,
      });
      const upload = await supa.storage.from("posts").upload(storagePath, img.bytes, {
        contentType: img.mime,
        upsert: true,
      });
      if (upload.error) throw new Error(`storage: ${upload.error.message}`);
      const pub = supa.storage.from("posts").getPublicUrl(storagePath);

      const { data: updated } = await supa
        .from("posts")
        .update({
          status: "ready",
          caption: post.caption,
          hashtags: post.hashtags ?? [],
          cta: post.cta,
          prompt: post.image_prompt,
          image_storage_path: storagePath,
          image_url: pub.data.publicUrl,
          meta: { model: GEMINI_IMAGE_MODEL, alt_text: post.alt_text },
          ready_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .select()
        .single();
      created.push(updated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[social-posts]", channel, msg);
      await supa.from("posts").insert({
        business_id: business.id,
        market_id: market.id,
        channel,
        language: lang.code,
        status: "failed",
        error: msg,
      });
    }
  }

  return json({ ok: true, posts: created });
});

async function generatePost(input: {
  channel: string;
  business: any;
  scraped: any;
  market: any;
  languageCode: string;
  languageName: string;
  trending?: string;
}) {
  const { channel, business, scraped, market, languageCode, languageName, trending } = input;
  const sys = `You are an elite global e-commerce copywriter and creative director. Output STRICT JSON only.`;
  const evidence = JSON.stringify({
    website: scraped?.website ?? null,
    instagram: scraped?.instagram ?? null,
  }).slice(0, 4000);

  const user = `Generate a localized ${channel.toUpperCase()} post for the brand.

BRAND: ${business.name ?? business.product_name ?? "Brand"}
PRODUCT: ${business.product_name ?? business.category ?? ""}
CATEGORY: ${business.category ?? ""}
IDEA: ${business.idea ?? ""}
WEBSITE: ${business.website ?? ""}
TARGET MARKET: ${market.country} (currency ${market.currency ?? ""}, marketplaces: ${(market.marketplaces ?? []).join(", ")})
COMPETITORS: ${(market.competitors ?? []).join(", ")}
TARGET LANGUAGE: ${languageName} (${languageCode}) — write everything in this language, native idioms.

EVIDENCE FROM WEBSITE/SOCIAL: ${evidence}

LIVE TRENDING SIGNALS (${market.country}, ${channel}):
${trending && trending.trim() ? trending.slice(0, 1500) : "(no live trend data — use evergreen best practices)"}

REQUIREMENTS for channel "${channel}":
- caption: scroll-stopping, ${channel === "tiktok" ? "<= 150 chars, hooky, casual" : channel === "linkedin" ? "professional, 3-4 short paragraphs" : "120-220 chars, emoji-rich, friendly"}
- hashtags: ${channel === "linkedin" ? 3 : 8} hashtags relevant to ${market.country} + product
- cta: short call-to-action, native phrasing
- image_prompt: a vivid English photo prompt describing the hero image to generate via Gemini. Use real product details, ${market.country}-friendly aesthetics, lighting, composition (${channel === "tiktok" ? "9:16 vertical" : channel === "x" ? "16:9 wide" : "1:1 square"}). Include any visible text overlay in ${languageName}.
- alt_text: short accessibility description in ${languageName}.

Return JSON: { "caption": str, "hashtags": [str...], "cta": str, "image_prompt": str, "alt_text": str }`;

  const data = await openaiJSON(sys, user);
  return data as {
    caption: string; hashtags: string[]; cta: string; image_prompt: string; alt_text: string;
  };
}

async function openaiJSON(system: string, user: string) {
  const tryModel = async (model: string) => {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`openai ${model} ${r.status}: ${t.slice(0, 200)}`);
    }
    const j = await r.json();
    const content = j.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(content);
  };
  try { return await tryModel(OPENAI_MODEL); }
  catch (e) {
    if (OPENAI_MODEL !== OPENAI_FALLBACK_MODEL) {
      console.warn("[social-posts] fallback", e);
      return await tryModel(OPENAI_FALLBACK_MODEL);
    }
    throw e;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}


async function generateGeminiImage(input: {
  prompt: string;
  referenceUrl?: string;
  aspect?: string;
}): Promise<{ bytes: Uint8Array; mime: string }> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY tanımlı değil");
  const parts: any[] = [{ text: input.prompt }];
  if (input.referenceUrl) {
    try {
      const r = await fetch(input.referenceUrl);
      if (r.ok) {
        const buf = new Uint8Array(await r.arrayBuffer());
        const mime = r.headers.get("content-type") ?? "image/jpeg";
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        parts.unshift({ inlineData: { mimeType: mime, data: btoa(bin) } });
      }
    } catch (_) {
      /* ignore */
    }
  }
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        ...(input.aspect ? { imageConfig: { aspectRatio: input.aspect } } : {}),
      },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`gemini ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  const inline = data?.candidates?.[0]?.content?.parts?.find(
    (p: any) => p?.inlineData?.data,
  )?.inlineData;
  if (!inline?.data) throw new Error("Gemini yanıtında görsel yok");
  const mime = inline.mimeType ?? "image/png";
  const bin = atob(inline.data as string);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}