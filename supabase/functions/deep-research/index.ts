// supabase/functions/deep-research
// Akış:
//   1) businesses kaydı al (business_id ile)
//   2) Web/Instagram context'i scrape et (scrape-context çağırır)
//   3) Tavily web search ile sektör/rakip/regülasyon araması (opsiyonel: TAVILY_API_KEY yoksa atla)
//   4) OpenAI gpt-5.5 ile sentez → strict JSON (pazar listesi + rationale)
//   5) markets satırlarını yaz, analyses.status = done
// SSE event'leri yayınlar: {phase, message, progress, payload?}
//
// İstemci EventSource veya fetch+stream ile dinler.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { tavilySearch, formatResults, hasTavily } from "../_shared/tavily.ts";
import { getAuthUser, assertBusinessOwner } from "../_shared/auth.ts";

interface RunRequest {
  business_id: string;
}

interface ScrapedContext {
  website?: {
    url: string;
    title?: string;
    description?: string;
    headings: string[];
    textSnippet: string;
    detectedKeywords: string[];
  };
  instagram?: { handle: string; note: string };
  ideaSummary?: string;
}

interface MarketJSON {
  country: string;
  country_code: string;
  flag: string;
  fit_score: number;
  marketplaces: string[];
  competition: "Düşük" | "Orta" | "Yüksek";
  est_demand: "Düşük" | "Orta" | "Yüksek";
  avg_margin: number;
  shipping_mode: "Hava" | "Kara" | "Deniz" | "Demiryolu";
  shipping_days: number;
  shipping_cost_per_kg: number;
  carbon_kg_per_kg: number;
  tax_note: string;
  rationale: string;
  competitors: string[];
  regulations: string[];
  currency: string;
  metrics: {
    market_size_usd?: number;
    cagr_pct?: number;
    tariff_pct?: number;
    avg_order_value_usd?: number;
    avg_price_usd?: number;
  };
  sources: string[];
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.5";
const OPENAI_FALLBACK_MODEL = "gpt-5.5";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return new Response("POST gerekli", { status: 405, headers: corsHeaders });

  let body: RunRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("Geçersiz JSON", { status: 400, headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY tanımlı değil", { status: 500, headers: corsHeaders });
  }

  const auth = await getAuthUser(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    await assertBusinessOwner(supa, body.business_id, auth.user_id);
  } catch (e) {
    if (e instanceof Response) {
      return new Response(e.body, { status: e.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const finish = () => controller.close();

      try {
        // 1) İşletmeyi al
        send({ phase: "init", message: "İşletme bilgileri yükleniyor", progress: 5 });
        const { data: biz, error: bizErr } = await supa
          .from("businesses")
          .select("*")
          .eq("id", body.business_id)
          .single();
        if (bizErr || !biz) throw new Error(`İşletme bulunamadı: ${bizErr?.message ?? "yok"}`);

        // Analiz kaydı oluştur
        const { data: analysis, error: aErr } = await supa
          .from("analyses")
          .insert({ business_id: biz.id, status: "scraping" })
          .select()
          .single();
        if (aErr || !analysis) throw new Error(`analyses insert: ${aErr?.message}`);
        send({ phase: "init", message: "Analiz başlatıldı", progress: 10, analysis_id: analysis.id });

        // 2) Scrape
        send({ phase: "scrape", message: "Web sitesi & Instagram taranıyor", progress: 20 });
        const scraped = await callScrape({
          website: biz.website ?? undefined,
          instagram: biz.instagram ?? undefined,
          idea: biz.idea ?? undefined,
        });
        await supa
          .from("analyses")
          .update({ scraped_context: scraped, status: "researching" })
          .eq("id", analysis.id);
        send({ phase: "scrape", message: "Context çıkarıldı", progress: 35, scraped });

        // 3) Tavily araştırma (opsiyonel)
        const webEvidence: string[] = [];
        let evidenceCount = 0;
        if (hasTavily()) {
          send({ phase: "research", message: "Web'de pazar/rakip taraması", progress: 45 });
          const queries = buildResearchQueries(biz, scraped);
          for (const q of queries) {
            const { results } = await tavilySearch(q, { max_results: 6, search_depth: "advanced" });
            evidenceCount += results.length;
            if (results.length) webEvidence.push(`### Sorgu: ${q}\n${formatResults(results)}`);
          }
          send({ phase: "research", message: `${evidenceCount} kaynak bulundu — rakip kazısı`, progress: 55 });

          // İkinci tur: ilk hızlı sentez ile rakip/marka isimleri çıkar, derin arama yap
          try {
            const probe = await quickProbe(biz, scraped, webEvidence);
            const probeQueries = (probe.competitors ?? [])
              .slice(0, 6)
              .map((c: string) => `${c} pricing reviews international expansion market share`)
              .concat(
                (probe.markets ?? []).slice(0, 5).map((m: string) =>
                  `${biz.category ?? biz.product_name ?? "product"} demand ${m} 2026 marketplaces tariff %`
                ),
              );
            for (const q of probeQueries) {
              const { results } = await tavilySearch(q, { max_results: 5, search_depth: "advanced" });
              evidenceCount += results.length;
              if (results.length) webEvidence.push(`### Derin: ${q}\n${formatResults(results)}`);
            }
          } catch (e) {
            console.warn("deep probe skipped", e);
          }
          send({ phase: "research", message: `Toplam ${evidenceCount} web kanıtı toplandı`, progress: 62 });
        } else {
          send({ phase: "research", message: "Tavily anahtarı yok — sadece LLM bilgisiyle devam", progress: 55 });
        }

        // 4) OpenAI sentez
        send({ phase: "synthesize", message: "AI pazar önerilerini üretiyor", progress: 65 });
        const markets = await synthesize(biz, scraped, webEvidence);

        // 5) Persist
        send({ phase: "score", message: "Sonuçlar kaydediliyor", progress: 85 });
        if (markets.length > 0) {
          const rows = markets.map((m) => ({ ...m, analysis_id: analysis.id }));
          const { error: mErr } = await supa.from("markets").insert(rows);
          if (mErr) throw new Error(`markets insert: ${mErr.message}`);
        }
        await supa
          .from("analyses")
          .update({ status: "done", completed_at: new Date().toISOString() })
          .eq("id", analysis.id);

        send({ phase: "done", message: "Tamamlandı", progress: 100, analysis_id: analysis.id, markets });
        finish();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        send({ phase: "error", message: msg, progress: 100 });
        finish();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

async function callScrape(payload: Record<string, unknown>): Promise<ScrapedContext> {
  const url = `${SUPABASE_URL}/functions/v1/scrape-context`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`scrape-context ${res.status}`);
  return await res.json();
}

function buildResearchQueries(biz: any, ctx: ScrapedContext): string[] {
  const product = biz.product_name || biz.category || ctx.website?.title || (biz.website ? `site:${biz.website}` : "Türk markası");
  const cat = biz.category || product || "product";
  const brand = biz.name || product;
  const idea = (biz.idea || "").slice(0, 120);
  const site = biz.website ? String(biz.website).replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
  const queries = [
    site ? `${site} brand overview products international` : "",
    site ? `site:${site}` : "",
    `${product} export markets Europe demand 2025 2026`,
    `${cat} marketplace fees Germany Netherlands UK 2025`,
    `${cat} import regulations EU UAE customs duties tariff %`,
    `${product} competitors international online`,
    `${brand} reviews international buyers`,
    `${cat} consumer trends 2026 Gulf Middle East`,
    `${product} shipping cost from Turkey logistics per kg air sea`,
    `${cat} sustainability label requirements EU 2026`,
    `${cat} market size USD 2025 forecast CAGR`,
    `${product} average price USD Amazon Otto Bol Noon`,
    `${cat} customer LTV average order value e-commerce 2025`,
    `${cat} top exporters Turkey 2025 statistics`,
    idea ? `${idea} target country opportunity export Turkey` : "",
  ].filter(Boolean) as string[];
  return queries;
}

// İlk kaba sentez: rakip/markları çıkartıp ikinci tur arama için kullan
async function quickProbe(
  biz: any,
  scraped: ScrapedContext,
  evidence: string[],
): Promise<{ competitors: string[]; markets: string[] }> {
  const sys =
    `Extract competitor brand names and likely target country names from the data. Output STRICT JSON: {"competitors":[],"markets":[]}. Max 6 each. English names.`;
  const user = `BUSINESS: ${biz.name ?? ""} - ${biz.product_name ?? biz.category ?? ""}\nWEB: ${scraped.website?.title ?? ""} ${scraped.website?.description ?? ""}\nKEYWORDS: ${(scraped.website?.detectedKeywords ?? []).join(", ")}\nEVIDENCE:\n${evidence.join("\n").slice(0, 4000)}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: OPENAI_FALLBACK_MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    }),
  });
  if (!r.ok) return { competitors: [], markets: [] };
  const j = await r.json();
  try {
    const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
    return {
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors.map(String) : [],
      markets: Array.isArray(parsed.markets) ? parsed.markets.map(String) : [],
    };
  } catch {
    return { competitors: [], markets: [] };
  }
}

const SYSTEM = `Sen GlobalNest'in derin pazar araştırma ajanısın.
Bir Türk KOBİ'si için, verilen işletme + web/Instagram context'i + web kanıtları
ile en uygun 5-8 yurtdışı pazarı seçeceksin.
Sadece geçerli JSON döndür, açıklama yazma. Şema:
{
  "markets": [
    {
      "country": "Almanya",
      "country_code": "DE",
      "flag": "🇩🇪",
      "fit_score": 87,             // 0-100
      "marketplaces": ["Otto", "Amazon.de"],
      "competition": "Yüksek",     // Düşük | Orta | Yüksek
      "est_demand": "Yüksek",      // Düşük | Orta | Yüksek
      "avg_margin": 34,            // %
      "shipping_mode": "Kara",     // Hava | Kara | Deniz | Demiryolu
      "shipping_days": 6,
      "shipping_cost_per_kg": 2.4, // USD
      "carbon_kg_per_kg": 0.18,
      "tax_note": "EORI + KDV %19",
      "rationale": "3-5 cümle Türkçe gerekçe, niceliksel veri ve kaynak referansı",
      "competitors": ["Marka A", "Marka B"],
      "regulations": ["CE işareti", "Dil etiketi DE"],
      "currency": "EUR",
      "metrics": {
        "market_size_usd": 1200000000,    // toplam pazar büyüklüğü USD
        "cagr_pct": 6.4,                  // yıllık büyüme %
        "tariff_pct": 4.5,                // gümrük vergisi %
        "avg_order_value_usd": 48,        // ortalama sipariş USD
        "avg_price_usd": 22                // ürün ortalama fiyat USD
      },
      "sources": ["https://...", "https://..."]   // web kanıtlarından 2-4 URL
    }
  ]
}
Türkçe yaz. fit_score'lar tutarlı ve gerekçeli olsun. Metrics alanında yalnızca
kanıtların desteklediği değerleri kullan; emin değilsen alanı atla. sources'da
kullandığın web kanıtı URL'lerini liste.`;

async function synthesize(
  biz: any,
  scraped: ScrapedContext,
  evidence: string[],
): Promise<MarketJSON[]> {
  const userPrompt = `# İşletme
- Ad: ${biz.name ?? "(isim yok)"}
- Web URL: ${biz.website ?? "(yok)"}
- Instagram: @${biz.instagram ?? "(yok)"}
- Açıklama / Fikir: ${biz.idea ?? "(yok)"}
${biz.category ? `- Kategori: ${biz.category}` : ""}
${biz.product_name ? `- Ürün: ${biz.product_name}` : ""}
${biz.unit_cost_try ? `- Birim maliyet: ${biz.unit_cost_try} TRY` : ""}
${biz.lead_time_days ? `- Tedarik süresi: ${biz.lead_time_days} gün` : ""}
${biz.weight_kg ? `- Ürün ağırlığı: ${biz.weight_kg} kg` : ""}

# Web context (${biz.website ?? "-"})
Title: ${scraped.website?.title ?? "-"}
Description: ${scraped.website?.description ?? "-"}
Başlıklar: ${scraped.website?.headings.join(" | ") ?? "-"}
Anahtar kelimeler: ${scraped.website?.detectedKeywords.join(", ") ?? "-"}
Metin: ${scraped.website?.textSnippet?.slice(0, 1500) ?? "-"}

# Web sitesi alt sayfaları (about, products, vs.)
${(scraped.website as any)?.pages?.map((p: any) => `## ${p.title ?? p.url} (${p.url})\n${p.snippet}`).join("\n\n").slice(0, 5000) ?? "(yok)"}

# Instagram
${scraped.instagram?.handle ? `@${scraped.instagram.handle}` : "(yok)"}

# Web kanıtları (Tavily çıktıları)
${evidence.join("\n\n").slice(0, 9000) || "(yok)"}

Yukarıdaki bilgilere göre 5-8 yurtdışı pazar öner. Şemaya tam uy. metrics ve
sources alanlarını mutlaka doldur (kanıtlardan gerçek URL'leri al). Sadece JSON.`;

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
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${model} ${res.status}: ${t.slice(0, 200)}`);
    }
    return await res.json();
  };

  let j: any;
  try {
    j = await tryModel(OPENAI_MODEL);
  } catch (e) {
    console.warn("deep-research primary model fail, fallback:", e);
    j = await tryModel(OPENAI_FALLBACK_MODEL);
  }
  const content = j.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  const markets = Array.isArray(parsed.markets) ? parsed.markets : [];
  return markets.map(sanitize).filter(Boolean) as MarketJSON[];
}

function sanitize(m: any): MarketJSON | null {
  if (!m || !m.country) return null;
  return {
    country: String(m.country),
    country_code: String(m.country_code ?? "").slice(0, 4),
    flag: String(m.flag ?? "🌍"),
    fit_score: clamp(int(m.fit_score, 60), 0, 100),
    marketplaces: Array.isArray(m.marketplaces) ? m.marketplaces.map(String) : [],
    competition: oneOf(m.competition, ["Düşük", "Orta", "Yüksek"], "Orta"),
    est_demand: oneOf(m.est_demand, ["Düşük", "Orta", "Yüksek"], "Orta"),
    avg_margin: num(m.avg_margin, 30),
    shipping_mode: oneOf(m.shipping_mode, ["Hava", "Kara", "Deniz", "Demiryolu"], "Kara"),
    shipping_days: int(m.shipping_days, 7),
    shipping_cost_per_kg: num(m.shipping_cost_per_kg, 2.5),
    carbon_kg_per_kg: num(m.carbon_kg_per_kg, 0.2),
    tax_note: String(m.tax_note ?? ""),
    rationale: String(m.rationale ?? ""),
    competitors: Array.isArray(m.competitors) ? m.competitors.map(String).slice(0, 8) : [],
    regulations: Array.isArray(m.regulations) ? m.regulations.map(String).slice(0, 8) : [],
    currency: String(m.currency ?? "USD"),
    metrics: {
      market_size_usd: numOpt(m.metrics?.market_size_usd),
      cagr_pct: numOpt(m.metrics?.cagr_pct),
      tariff_pct: numOpt(m.metrics?.tariff_pct),
      avg_order_value_usd: numOpt(m.metrics?.avg_order_value_usd),
      avg_price_usd: numOpt(m.metrics?.avg_price_usd),
    },
    sources: Array.isArray(m.sources) ? m.sources.map(String).slice(0, 6) : [],
  };
}

function numOpt(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function int(v: unknown, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : d;
}
function num(v: unknown, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function oneOf<T extends string>(v: unknown, allowed: T[], d: T): T {
  return (allowed as string[]).includes(v as string) ? (v as T) : d;
}
