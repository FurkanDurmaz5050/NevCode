// Video render orchestration helpers.
import { ANON_KEY, FUNCTIONS_URL, supabase, getFunctionAuthHeader } from "./supabase";

export type VideoComposition = "ProductHero" | "MarketSpotlight" | "SocialReel";

export type VideoStatus = "queued" | "rendering" | "ready" | "failed" | "preview";

export interface VideoScene {
  index?: number;
  title_tr?: string;
  duration_seconds?: number;
  voiceover?: string;
  caption?: string;
  visual?: string;
}

export interface VideoScript {
  language_code?: string;
  language_name?: string;
  hook?: string;
  value_props?: string[];
  scenes?: VideoScene[];
  cta?: string;
  cta_link_text?: string;
  hashtags?: string[];
  tone?: string;
  compliance_notes?: string[];
}

export interface VideoRow {
  id: string;
  business_id: string;
  market_id: string | null;
  composition: VideoComposition;
  language: string | null;
  duration_seconds: number | null;
  hook: string | null;
  cta: string | null;
  status: VideoStatus;
  progress: number | null;
  url: string | null;
  storage_path: string | null;
  render_id: string | null;
  error: string | null;
  script: VideoScript | null;
  props: Record<string, unknown> | null;
  created_at: string;
  ready_at: string | null;
}

/** Bir pazar için render kuyruğa al. Geriye videos satırını döner. */
export async function startRender(opts: {
  market_id: string;
  composition?: VideoComposition;
  product_image_url?: string;
}): Promise<{ video_id: string; render_id?: string; composition: VideoComposition }> {
  const res = await fetch(`${FUNCTIONS_URL}/render-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await getFunctionAuthHeader(),
      apikey: ANON_KEY,
    },
    body: JSON.stringify(opts),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `render-video ${res.status}`);
  return j;
}

/** Mevcut kullanıcının tüm videolarını yükler (RLS auth.uid() ile filtreler). */
export async function loadVideos(): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`videos load: ${error.message}`);
  return (data ?? []) as VideoRow[];
}

/** İlk N pazar için MarketSpotlight render'ı tetikle (toplu). */
export async function renderTopMarkets(
  marketIds: string[],
  composition: VideoComposition = "MarketSpotlight",
): Promise<{ video_id: string }[]> {
  const out: { video_id: string }[] = [];
  for (const id of marketIds) {
    try {
      const r = await startRender({ market_id: id, composition });
      out.push({ video_id: r.video_id });
    } catch (e) {
      // tek başarısız iş tüm batch'i öldürmesin
      console.warn("render fail", id, e);
    }
  }
  return out;
}
