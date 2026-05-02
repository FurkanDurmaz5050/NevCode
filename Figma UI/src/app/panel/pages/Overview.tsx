import { useEffect, useState } from "react";
import { Globe2, Film, MessageSquare, Activity, ArrowUpRight, RefreshCw, TrendingUp, Sparkles } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { loadOverview, type OverviewMetrics } from "../../lib/metrics";

export function OverviewPage() {
  const [data, setData] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const m = await loadOverview();
      setData(m);
    } catch (e) {
      console.error("[overview] load failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Genel Bakış</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.hasData
              ? `${data.marketCount} pazar · ${data.videoCount} video · ${data.postCount} sosyal post`
              : "Henüz veri yok — Start ekranından bir analiz başlat."}
          </p>
        </div>
        <button onClick={() => void refresh()} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Globe2} label="Pazar önerisi" value={String(data?.marketCount ?? 0)} color="emerald" />
        <Stat icon={Film} label="Üretilen video" value={String(data?.videoCount ?? 0)} sub={data ? `${data.videoReadyCount} hazır` : undefined} color="violet" />
        <Stat icon={MessageSquare} label="Sosyal post" value={String(data?.postCount ?? 0)} sub={data ? `${data.postReadyCount} hazır` : undefined} color="sky" />
        <Stat icon={Activity} label="AI çağrı" value={String(data?.callCount ?? 0)} color="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">Üretim aktivitesi (son 7 gün)</p>
              <p className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>
                {data?.videoTimeline.reduce((a, b) => a + b.v, 0) ?? 0} video
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-3 h-3" /> live
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.videoTimeline ?? []}>
                <defs>
                  <linearGradient id="actv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2} fill="url(#actv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Kanal dağılımı</p>
          <p className="text-lg tracking-tight mb-3" style={{ fontWeight: 600 }}>Tüm postlar</p>
          {data && data.channelBreakdown.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.channelBreakdown} dataKey="v" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {data.channelBreakdown.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">Henüz post yok</div>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontWeight: 600 }}>En uygun pazarlar</p>
            <span className="text-xs text-slate-400">fit_score'a göre</span>
          </div>
          {data && data.topMarkets.length > 0 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topMarkets} layout="vertical">
                  <XAxis type="number" hide />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="fit_score" radius={[0, 8, 8, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">Henüz analiz yok</div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {data?.topMarkets.map((m) => (
              <div key={m.country} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50">
                <span><span className="mr-2">{m.flag ?? "🌐"}</span>{m.country}</span>
                <span className="text-xs text-emerald-600 tabular-nums">{m.fit_score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p style={{ fontWeight: 600 }} className="mb-3">Son video render'lar</p>
          {data && data.recentVideos.length > 0 ? (
            <div className="space-y-2">
              {data.recentVideos.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    <span className="truncate">{v.composition}</span>
                    {v.market_country && <span className="text-slate-400">· {v.market_country}</span>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full ${
                    v.status === "ready" ? "bg-emerald-50 text-emerald-700" :
                    v.status === "rendering" ? "bg-sky-50 text-sky-700" :
                    v.status === "failed" ? "bg-rose-50 text-rose-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>{v.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">Henüz render yok</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl tracking-tight" style={{ fontWeight: 600 }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
