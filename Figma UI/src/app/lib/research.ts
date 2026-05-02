// Pazar araştırması — businesses kaydı oluştur, deep-research SSE'i dinle.

import { ANON_KEY, FUNCTIONS_URL, supabase } from "./supabase";
import { getDemoUserId } from "./user";
import type { BusinessInput } from "./analyzer";

export interface MarketRow {
  id: string;
  analysis_id: string;
  country: string;
  country_code: string | null;
  flag: string | null;
  fit_score: number;
  marketplaces: string[];
  competition: string | null;
  est_demand: string | null;
  avg_margin: number | null;
  shipping_mode: string | null;
  shipping_days: number | null;
  shipping_cost_per_kg: number | null;
  carbon_kg_per_kg: number | null;
  tax_note: string | null;
  rationale: string | null;
  competitors: string[];
  regulations: string[];
  currency: string | null;
}

export interface ResearchEvent {
  phase: "init" | "scrape" | "research" | "synthesize" | "score" | "done" | "error";
  message: string;
  progress: number;
  analysis_id?: string;
  scraped?: unknown;
  markets?: MarketRow[];
}

/** İşletme kaydını oluşturur veya günceller. */
export async function upsertBusiness(input: BusinessInput & { weightKg?: number }) {
  const owner_id = getDemoUserId();
  const payload = {
    owner_id,
    name: input.productName ?? null,
    website: input.website ?? null,
    instagram: input.instagram?.replace(/^@/, "") ?? null,
    category: input.category ?? null,
    product_name: input.productName ?? null,
    idea: input.idea ?? null,
    unit_cost_try: input.unitCostTRY ?? null,
    lead_time_days: input.leadTimeDays ?? null,
    weight_kg: input.weightKg ?? 1,
  };
  const { data, error } = await supabase
    .from("businesses")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(`businesses insert: ${error.message}`);
  return data as { id: string };
}

/** Deep research SSE — her event için onEvent çağrılır. */
export async function streamDeepResearch(
  business_id: string,
  onEvent: (e: ResearchEvent) => void,
): Promise<void> {
  const res = await fetch(`${FUNCTIONS_URL}/deep-research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ business_id }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`deep-research ${res.status}: ${text}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const evt = JSON.parse(payload) as ResearchEvent;
        onEvent(evt);
      } catch {
        // skip malformed
      }
    }
  }
}

export async function loadMarkets(analysis_id: string): Promise<MarketRow[]> {
  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .eq("analysis_id", analysis_id)
    .order("fit_score", { ascending: false });
  if (error) throw new Error(`markets load: ${error.message}`);
  return (data ?? []) as MarketRow[];
}

export async function loadLatestAnalysis(): Promise<
  { id: string; business_id: string; markets: MarketRow[] } | null
> {
  const owner_id = getDemoUserId();
  const { data: bizList } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", owner_id)
    .order("created_at", { ascending: false })
    .limit(1);
  const businessId = bizList?.[0]?.id;
  if (!businessId) return null;
  const { data: ana } = await supabase
    .from("analyses")
    .select("id,business_id")
    .eq("business_id", businessId)
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1);
  const a = ana?.[0];
  if (!a) return null;
  const markets = await loadMarkets(a.id);
  return { id: a.id, business_id: a.business_id, markets };
}
