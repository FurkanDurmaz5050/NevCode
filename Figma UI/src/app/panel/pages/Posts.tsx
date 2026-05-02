import { useEffect, useMemo, useState } from "react";
import {
  Megaphone, Sparkles, Loader2, RefreshCw, AlertCircle, Globe, Hash, Copy, Check,
  Instagram, Facebook, Linkedin, Twitter,
} from "lucide-react";
import { loadLatestAnalysis, type MarketRow } from "../../lib/research";
import { generateSocialPosts, listPosts, type PostChannel, type PostRow } from "../../lib/posts";
import { useBusinessState } from "../../lib/business";

const CHANNELS: { id: PostChannel; label: string; icon: any; color: string }[] = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-pink-500" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "bg-blue-600" },
  { id: "tiktok", label: "TikTok", icon: Megaphone, color: "bg-slate-900" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-sky-700" },
  { id: "x", label: "X / Twitter", icon: Twitter, color: "bg-slate-800" },
];

const REFRESH_MS = 5000;

export function PostsPage() {
  const biz = useBusinessState();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [marketId, setMarketId] = useState<string>("");
  const [selected, setSelected] = useState<Record<PostChannel, boolean>>({
    instagram: true, facebook: false, tiktok: true, linkedin: false, x: false, amazon: false, etsy: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = async () => {
    if (!biz.business) return;
    try {
      const [ps, latest] = await Promise.all([
        listPosts(biz.business.id),
        loadLatestAnalysis(),
      ]);
      setPosts(ps);
      setMarkets(latest?.markets ?? []);
      if (!marketId && latest?.markets?.[0]) setMarketId(latest.markets[0].id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    void refresh();
    const t = setInterval(() => {
      if (posts.some((p) => p.status === "generating" || p.status === "queued")) void refresh();
    }, REFRESH_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biz.business?.id, posts.length]);

  const onGenerate = async () => {
    if (!marketId) return;
    const channels = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k as PostChannel);
    if (channels.length === 0) {
      setError("En az bir kanal seç");
      return;
    }
    setBusy(true); setError(null);
    try {
      await generateSocialPosts({ market_id: marketId, channels });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const market = useMemo(() => markets.find((m) => m.id === marketId), [markets, marketId]);

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Sosyal Postlar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Her pazara özel görsel + metin — Gemini ile üretilir, hedef dilde.
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Yenile
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Hedef pazar</label>
            <select
              value={marketId}
              onChange={(e) => setMarketId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm"
            >
              {markets.length === 0 && <option value="">Önce pazar analizi yap</option>}
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.flag ?? "🌍"} {m.country} — fit {m.fit_score}
                </option>
              ))}
            </select>
            {market && (
              <p className="text-xs text-slate-500 mt-2">
                Dil otomatik: {market.country}. Pazaryerleri: {market.marketplaces.join(", ")}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Kanallar</label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => {
                const on = selected[c.id];
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected({ ...selected, [c.id]: !on })}
                    className={`px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border ${
                      on ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    <c.icon className="w-3.5 h-3.5" /> {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onGenerate}
            disabled={busy || !marketId}
            className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm flex items-center gap-1.5 hover:bg-violet-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Postları üret
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.length === 0 && !busy && (
          <div className="col-span-full rounded-2xl bg-white border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            Henüz post yok. Üstten bir pazar seçip "Postları üret"e tıkla.
          </div>
        )}
        {posts.map((p) => {
          const ch = CHANNELS.find((c) => c.id === p.channel);
          return (
            <div key={p.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="aspect-square bg-slate-100 relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {p.status === "generating"
                      ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      : <Megaphone className="w-8 h-8 text-slate-300" />}
                  </div>
                )}
                {ch && (
                  <span className={`absolute top-2 left-2 ${ch.color} text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1`}>
                    <ch.icon className="w-3 h-3" /> {ch.label}
                  </span>
                )}
                <span className="absolute top-2 right-2 bg-white/90 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {p.language ?? "–"}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {p.status === "failed" ? (
                  <p className="text-xs text-rose-600 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5" /> {p.error}
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-slate-700 line-clamp-4 whitespace-pre-wrap">{p.caption}</p>
                    {p.hashtags?.length > 0 && (
                      <p className="text-[11px] text-blue-600 flex items-start gap-1 flex-wrap">
                        <Hash className="w-3 h-3 mt-0.5 shrink-0" />
                        {p.hashtags.join(" ")}
                      </p>
                    )}
                    {p.cta && (
                      <p className="text-xs text-slate-900" style={{ fontWeight: 500 }}>
                        → {p.cta}
                      </p>
                    )}
                    <button
                      onClick={() => copy(p.id, [p.caption, p.hashtags?.join(" "), p.cta].filter(Boolean).join("\n\n"))}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-center gap-1 hover:bg-slate-100"
                    >
                      {copied === p.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === p.id ? "Kopyalandı" : "Metni kopyala"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
