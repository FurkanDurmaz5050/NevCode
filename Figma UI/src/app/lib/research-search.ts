// Tavily web arama wrapper'ı — research-search edge fn proxy'si.
import { ANON_KEY, FUNCTIONS_URL } from "./supabase";

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  published_date: string | null;
  score: number | null;
}

export interface SearchResponse {
  query: string;
  answer: string | null;
  results: SearchHit[];
}

export async function webSearch(
  query: string,
  opts: { max_results?: number; depth?: "basic" | "advanced"; topic?: "general" | "news"; days?: number } = {},
): Promise<SearchResponse> {
  const res = await fetch(`${FUNCTIONS_URL}/research-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ query, ...opts }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`research-search ${res.status}: ${t}`);
  }
  return res.json();
}
