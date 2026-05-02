// supabase/functions/scrape-context
// Verilen web sitesi ve Instagram handle'ından temel context'i toplar.
// - Web: HTML çek, <title>, meta description, og tags, h1/h2, body text özeti.
// - Instagram: ToS riski nedeniyle scrape ETMEZ — kullanıcının verdiği handle'ı
//   ve bio metnini context olarak iletir (frontend'de açıklama alanı doldurulur).
// Çıktı yapılandırılmış JSON olarak döner; deep-research bunu girdi alır.

import { corsHeaders, handleOptions } from "../_shared/cors.ts";

interface ScrapeRequest {
  website?: string;
  instagram?: string;
  idea?: string;
}

interface ScrapedContext {
  website?: {
    url: string;
    title?: string;
    description?: string;
    ogImage?: string;
    headings: string[];
    textSnippet: string;
    detectedKeywords: string[];
    pages?: { url: string; title?: string; snippet: string }[];
  };
  instagram?: {
    handle: string;
    note: string;
  };
  ideaSummary?: string;
}

const MAX_HTML_BYTES = 500_000; // 500KB cap
const FETCH_TIMEOUT_MS = 8000;
const MAX_SUB_PAGES = 5;
const SUB_PAGE_HINTS = [
  /about/i, /hakkimizda/i, /hakkinda/i, /kurumsal/i,
  /products?/i, /urun/i, /collection/i, /shop/i,
  /catalog/i, /katalog/i, /export/i, /ihracat/i,
  /quality/i, /kalite/i, /certificate/i, /sertifika/i,
];

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);

  let body: ScrapeRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz JSON" }, 400);
  }

  const ctx: ScrapedContext = {};

  if (body.website) {
    try {
      ctx.website = await scrapeWebsite(body.website);
    } catch (e) {
      ctx.website = {
        url: body.website,
        headings: [],
        textSnippet: "",
        detectedKeywords: [],
        // @ts-expect-error attach error inline
        error: String(e),
      };
    }
  }

  if (body.instagram) {
    const handle = body.instagram.replace(/^@/, "").trim();
    ctx.instagram = {
      handle,
      note:
        "Instagram içeriği ToS nedeniyle otomatik scrape edilmedi — handle ve kullanıcı açıklaması context olarak kullanılacak.",
    };
  }

  if (body.idea) {
    ctx.ideaSummary = body.idea.trim().slice(0, 2000);
  }

  return json(ctx);
});

async function scrapeWebsite(rawUrl: string) {
  const url = normalizeUrl(rawUrl);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let html = "";
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GlobalNestBot/1.0; +https://globalnest.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Body okunamadı");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_HTML_BYTES) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    reader.cancel();
    html = new TextDecoder().decode(concat(chunks));
  } finally {
    clearTimeout(timer);
  }

  const title = match(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description = metaContent(html, "description") ??
    metaContent(html, "og:description");
  const ogImage = metaContent(html, "og:image");
  const headings = [
    ...allMatches(html, /<h1[^>]*>([^<]+)<\/h1>/gi),
    ...allMatches(html, /<h2[^>]*>([^<]+)<\/h2>/gi),
  ].slice(0, 12).map(decode).map((s) => s.trim()).filter(Boolean);

  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const textSnippet = decode(stripped).slice(0, 2500);

  const detectedKeywords = topKeywords(textSnippet, 15);

  // Alt sayfaları tara (about, products, vs.)
  const subPages = await scrapeSubPages(html, url);

  return {
    url,
    title: title ? decode(title).trim() : undefined,
    description: description ? decode(description).trim() : undefined,
    ogImage,
    headings,
    textSnippet,
    detectedKeywords,
    pages: subPages,
  };
}

async function scrapeSubPages(
  html: string,
  baseUrl: string,
): Promise<{ url: string; title?: string; snippet: string }[]> {
  const linkRe = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([^<]{0,80})<\/a>/gi;
  const seen = new Set<string>();
  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  let baseHost: string;
  try {
    baseHost = new URL(baseUrl).host;
  } catch {
    return [];
  }
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    if (!SUB_PAGE_HINTS.some((re) => re.test(href) || re.test(m![2]))) continue;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).toString().split("#")[0];
    } catch {
      continue;
    }
    let host: string;
    try {
      host = new URL(abs).host;
    } catch {
      continue;
    }
    if (host !== baseHost) continue;
    if (seen.has(abs) || abs === baseUrl) continue;
    seen.add(abs);
    candidates.push(abs);
    if (candidates.length >= MAX_SUB_PAGES) break;
  }

  const out: { url: string; title?: string; snippet: string }[] = [];
  for (const u of candidates) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(u, {
        signal: ac.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; GlobalNestBot/1.0; +https://globalnest.app)",
        },
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const subHtml = (await res.text()).slice(0, MAX_HTML_BYTES);
      const title = match(subHtml, /<title[^>]*>([^<]+)<\/title>/i);
      const stripped = subHtml
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      out.push({
        url: u,
        title: title ? decode(title).trim() : undefined,
        snippet: decode(stripped).slice(0, 1200),
      });
    } catch {
      // skip
    }
  }
  return out;
}

function normalizeUrl(u: string): string {
  const trimmed = u.trim();
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function match(s: string, re: RegExp): string | undefined {
  const m = s.match(re);
  return m?.[1];
}

function allMatches(s: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}

function metaContent(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escape(name)}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  return match(html, re) ?? match(
    html,
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${escape(name)}["']`,
      "i",
    ),
  );
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((a, c) => a + c.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "are", "you", "your",
  "have", "has", "was", "were", "but", "not", "all", "can", "will", "our",
  "ile", "ve", "bir", "bu", "için", "olan", "veya", "daha", "çok", "her",
  "gibi", "ama", "ise", "ben", "biz", "siz", "olarak",
]);

function topKeywords(text: string, n: number): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/[^a-zçğıöşü0-9]+/i)) {
    const w = raw.trim();
    if (w.length < 4 || STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
