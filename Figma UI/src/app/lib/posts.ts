// Sosyal post / pazaryeri içerik üretimi (Gemini görseli + OpenAI metni)

import { ANON_KEY, FUNCTIONS_URL, supabase, getFunctionAuthHeader } from "./supabase";

export type PostChannel = "instagram" | "facebook" | "tiktok" | "linkedin" | "x" | "amazon" | "etsy";
export type PostStatus = "queued" | "generating" | "ready" | "failed";

export interface PostRow {
  id: string;
  business_id: string;
  market_id: string | null;
  channel: PostChannel;
  language: string | null;
  status: PostStatus;
  caption: string | null;
  hashtags: string[];
  cta: string | null;
  image_storage_path: string | null;
  image_url: string | null;
  prompt: string | null;
  meta: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  ready_at: string | null;
}

export async function listPosts(business_id: string): Promise<PostRow[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("business_id", business_id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

export async function generateSocialPosts(input: {
  market_id: string;
  channels?: PostChannel[];
  language?: string;
}): Promise<{ ok: boolean; posts: PostRow[] }> {
  const res = await fetch(`${FUNCTIONS_URL}/social-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await getFunctionAuthHeader(),
      apikey: ANON_KEY,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`social-posts ${res.status}: ${t}`);
  }
  return res.json();
}

export async function generateImage(input: {
  prompt: string;
  reference_image_url?: string;
  aspect?: "1:1" | "9:16" | "16:9" | "4:5";
  storage_bucket?: string;
  storage_path?: string;
}): Promise<{ image_url: string; storage_path?: string; mime_type: string; model: string }> {
  const res = await fetch(`${FUNCTIONS_URL}/gemini-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await getFunctionAuthHeader(),
      apikey: ANON_KEY,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`gemini-image ${res.status}: ${t}`);
  }
  return res.json();
}
