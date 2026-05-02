// supabase/functions/research-search
// ResearchAgent (ve diğer LLM tool-call'ları) için Tavily proxy'si.
// Body: { query: string, max_results?: number, depth?: "basic"|"advanced", topic?: "general"|"news", days?: number }

import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { tavilySearch, hasTavily } from "../_shared/tavily.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);

  if (!hasTavily()) {
    return json({
      error: "TAVILY_API_KEY tanımlı değil",
      hint: "supabase/functions/.env içine TAVILY_API_KEY ekle ve serve'i yeniden başlat.",
    }, 400);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz JSON" }, 400);
  }
  const query = String(body.query ?? "").trim();
  if (!query) return json({ error: "query zorunlu" }, 400);

  const { answer, results } = await tavilySearch(query, {
    max_results: Math.min(10, Math.max(1, Number(body.max_results) || 5)),
    search_depth: body.depth === "advanced" ? "advanced" : "basic",
    include_answer: true,
    topic: body.topic === "news" ? "news" : "general",
    days: body.days ? Number(body.days) : undefined,
  });

  return json({
    query,
    answer: answer ?? null,
    results: results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: (r.content ?? "").slice(0, 600),
      published_date: r.published_date ?? null,
      score: r.score ?? null,
    })),
  });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
