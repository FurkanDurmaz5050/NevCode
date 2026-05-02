// Ortak Tavily web arama yardımcısı.
// TAVILY_API_KEY yoksa hata atmaz, boş sonuç döndürür.

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

export interface TavilySearchOptions {
  max_results?: number;
  search_depth?: "basic" | "advanced";
  include_answer?: boolean;
  topic?: "general" | "news";
  days?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  timeout_ms?: number;
}

const TAVILY_URL = "https://api.tavily.com/search";

export function hasTavily(): boolean {
  return !!Deno.env.get("TAVILY_API_KEY");
}

export async function tavilySearch(
  query: string,
  opts: TavilySearchOptions = {},
): Promise<{ answer?: string; results: TavilyResult[] }> {
  const key = Deno.env.get("TAVILY_API_KEY");
  if (!key) return { results: [] };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout_ms ?? 15000);
  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        max_results: opts.max_results ?? 5,
        search_depth: opts.search_depth ?? "basic",
        include_answer: opts.include_answer ?? false,
        topic: opts.topic ?? "general",
        ...(opts.days ? { days: opts.days } : {}),
        ...(opts.include_domains ? { include_domains: opts.include_domains } : {}),
        ...(opts.exclude_domains ? { exclude_domains: opts.exclude_domains } : {}),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn(`[tavily] ${res.status}`, (await res.text()).slice(0, 200));
      return { results: [] };
    }
    const j = await res.json();
    return {
      answer: j.answer,
      results: Array.isArray(j.results) ? j.results : [],
    };
  } catch (e) {
    console.warn("[tavily] error", e instanceof Error ? e.message : String(e));
    return { results: [] };
  } finally {
    clearTimeout(t);
  }
}

export function formatResults(items: TavilyResult[], maxChars = 280): string {
  return items
    .map(
      (r) =>
        `- [${r.title}](${r.url})\n  ${(r.content ?? "").replace(/\s+/g, " ").slice(0, maxChars)}`,
    )
    .join("\n");
}
