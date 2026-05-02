// Live overview metrics — kullanıcının business'ı için aggregate.
// RLS açık olduğu için query'ler otomatik filtrelenir.
import { supabase } from "./supabase";

export interface OverviewMetrics {
  hasData: boolean;
  marketCount: number;
  videoCount: number;
  videoReadyCount: number;
  postCount: number;
  postReadyCount: number;
  callCount: number;
  shipmentCount: number;
  topMarkets: Array<{ country: string; flag: string | null; fit_score: number }>;
  videoTimeline: Array<{ d: string; v: number }>; // son 7 gün
  channelBreakdown: Array<{ name: string; v: number; color: string }>;
  recentVideos: Array<{ id: string; composition: string; status: string; created_at: string; market_country?: string }>;
}

const CHANNEL_COLORS: Record<string, string> = {
  instagram: "#ec4899",
  facebook: "#3b82f6",
  tiktok: "#0f172a",
  linkedin: "#0a66c2",
  x: "#0ea5e9",
  amazon: "#f59e0b",
  etsy: "#ef4444",
};

export async function loadOverview(): Promise<OverviewMetrics> {
  const empty: OverviewMetrics = {
    hasData: false,
    marketCount: 0,
    videoCount: 0,
    videoReadyCount: 0,
    postCount: 0,
    postReadyCount: 0,
    callCount: 0,
    shipmentCount: 0,
    topMarkets: [],
    videoTimeline: [],
    channelBreakdown: [],
    recentVideos: [],
  };

  // En son business'ı bul
  const { data: bizs } = await supabase
    .from("businesses")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);
  const business_id = bizs?.[0]?.id;
  if (!business_id) return empty;

  const [analysesRes, videosRes, postsRes, callsRes, shipRes] = await Promise.all([
    supabase.from("analyses").select("id").eq("business_id", business_id),
    supabase.from("videos").select("id,composition,status,created_at,market_id").eq("business_id", business_id).order("created_at", { ascending: false }).limit(50),
    supabase.from("posts").select("id,channel,status,created_at").eq("business_id", business_id).limit(500),
    supabase.from("calls").select("id").eq("business_id", business_id),
    supabase.from("shipments").select("id").eq("business_id", business_id),
  ]);

  const analysisIds = (analysesRes.data ?? []).map((a) => a.id);
  let topMarkets: OverviewMetrics["topMarkets"] = [];
  let marketCount = 0;
  const marketCountryById = new Map<string, string>();
  if (analysisIds.length) {
    const { data: marketsData, count } = await supabase
      .from("markets")
      .select("id,country,flag,fit_score", { count: "exact" })
      .in("analysis_id", analysisIds)
      .order("fit_score", { ascending: false });
    marketCount = count ?? marketsData?.length ?? 0;
    topMarkets = (marketsData ?? []).slice(0, 4).map((m) => ({
      country: m.country,
      flag: m.flag,
      fit_score: m.fit_score,
    }));
    for (const m of marketsData ?? []) marketCountryById.set(m.id, m.country);
  }

  const videos = videosRes.data ?? [];
  const videoCount = videos.length;
  const videoReadyCount = videos.filter((v) => v.status === "ready").length;

  // Son 7 gün timeline
  const now = new Date();
  const days: Array<{ d: string; v: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("tr-TR", { weekday: "short" });
    const v = videos.filter((vid) => vid.created_at?.slice(0, 10) === key).length;
    days.push({ d: label, v });
  }

  const posts = postsRes.data ?? [];
  const postCount = posts.length;
  const postReadyCount = posts.filter((p) => p.status === "ready").length;
  const channelMap = new Map<string, number>();
  for (const p of posts) channelMap.set(p.channel, (channelMap.get(p.channel) ?? 0) + 1);
  const channelBreakdown = Array.from(channelMap.entries())
    .map(([name, v]) => ({ name, v, color: CHANNEL_COLORS[name] ?? "#64748b" }))
    .sort((a, b) => b.v - a.v);

  const recentVideos = videos.slice(0, 6).map((v) => ({
    id: v.id,
    composition: v.composition,
    status: v.status,
    created_at: v.created_at,
    market_country: v.market_id ? marketCountryById.get(v.market_id) : undefined,
  }));

  return {
    hasData: true,
    marketCount,
    videoCount,
    videoReadyCount,
    postCount,
    postReadyCount,
    callCount: callsRes.data?.length ?? 0,
    shipmentCount: shipRes.data?.length ?? 0,
    topMarkets,
    videoTimeline: days,
    channelBreakdown,
    recentVideos,
  };
}
