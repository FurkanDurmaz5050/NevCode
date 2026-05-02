import { useEffect, useMemo, useState } from "react";
import {
  Play, Plus, Film, Clock, Globe, MoreVertical, Loader2,
  Download, RefreshCw, AlertCircle, X, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { loadLatestAnalysis, type MarketRow } from "../../lib/research";
import {
  loadVideos, startRender, renderTopMarkets,
  type VideoComposition, type VideoRow,
} from "../../lib/videos";

const COMPOSITIONS: { id: VideoComposition; label: string; ratio: string }[] = [
  { id: "MarketSpotlight", label: "Pazar Spotu (30sn)", ratio: "16:9" },
  { id: "ProductHero", label: "Ürün Hero (15sn)", ratio: "16:9" },
  { id: "SocialReel", label: "Reels / TikTok (20sn)", ratio: "9:16" },
];

const REFRESH_MS = 4000;

export function VideosPage() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [vs, latest] = await Promise.all([loadVideos(), loadLatestAnalysis()]);
      setVideos(vs);
      setMarkets(latest?.markets ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      // hâlâ render'da olan video varsa yenile
      if (videos.some((v) => v.status === "queued" || v.status === "rendering")) {
        refresh();
      }
    }, REFRESH_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos.length, videos.map((v) => v.status).join(",")]);

  const stats = useMemo(() => {
    const langs = new Set(videos.map((v) => v.language).filter(Boolean));
    return {
      total: videos.length,
      langs: langs.size,
      queue: videos.filter((v) => v.status === "queued" || v.status === "rendering").length,
    };
  }, [videos]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Video Stüdyosu</h1>
          <p className="text-sm text-slate-500 mt-1">Remotion ile çok dilli pazarlama videoları</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Yenile
          </button>
          <button
            onClick={() => setPicker(true)}
            disabled={markets.length === 0}
            className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm flex items-center gap-1.5 hover:bg-violet-700 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni video
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Stat icon={Film} label="Toplam video" value={String(stats.total)} />
        <Stat icon={Globe} label="Dil" value={String(stats.langs)} />
        <Stat icon={Clock} label="Render kuyruğu" value={String(stats.queue)} />
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 flex items-center justify-center text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Yükleniyor...
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          hasMarkets={markets.length > 0}
          onCreate={() => setPicker(true)}
          onRenderAll={async () => {
            setBusy(true);
            try {
              await renderTopMarkets(markets.slice(0, 4).map((m) => m.id));
              await refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setBusy(false);
            }
          }}
          busy={busy}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <VideoCard key={v.id} v={v} />
          ))}
        </div>
      )}

      {picker && (
        <RenderPicker
          markets={markets}
          onClose={() => setPicker(false)}
          onConfirm={async (marketId, composition) => {
            setBusy(true);
            setPicker(false);
            try {
              await startRender({ market_id: marketId, composition });
              await refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

function VideoCard({ v }: { v: VideoRow }) {
  const [expanded, setExpanded] = useState(false);
  const ratio = v.composition === "SocialReel" ? "9:16" : "16:9";
  const color =
    v.composition === "SocialReel"
      ? "from-violet-500 to-fuchsia-500"
      : v.composition === "ProductHero"
      ? "from-emerald-500 to-teal-500"
      : "from-sky-500 to-indigo-500";

  const isPreview = v.status === "preview";

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden group">
      <div className={`relative aspect-video bg-gradient-to-br ${color} flex items-center justify-center`}>
        {v.url ? (
          <video src={v.url} controls className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white text-center px-4">
            {v.status === "rendering" || v.status === "queued" ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs">Render ediliyor… %{v.progress ?? 5}</span>
              </>
            ) : v.status === "failed" ? (
              <>
                <AlertCircle className="w-8 h-8" />
                <span className="text-xs">Başarısız</span>
              </>
            ) : isPreview ? (
              <>
                <FileText className="w-8 h-8" />
                <span className="text-xs opacity-90">Storyboard preview</span>
                <span className="text-[10px] opacity-75">MP4 için Remotion Lambda kur</span>
              </>
            ) : (
              <Play className="w-8 h-8" />
            )}
          </div>
        )}
        <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded bg-black/40 text-white backdrop-blur">
          {v.language ?? "?"}
        </span>
        <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-black/40 text-white backdrop-blur">
          {ratio}
        </span>
        <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded bg-black/60 text-white">
          {v.duration_seconds ?? "?"}sn
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm" style={{ fontWeight: 500 }}>{v.hook ?? v.composition}</p>
          <button className="p-1 rounded hover:bg-slate-100 shrink-0">
            <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>{v.composition}</span>
          <StatusBadge status={v.status} />
        </div>

        {(v.script?.scenes?.length ?? 0) > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 w-full text-left text-xs text-violet-600 hover:underline flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Storyboard'u gizle" : "Storyboard'u gör (" + v.script!.scenes!.length + " sahne)"}
          </button>
        )}

        {expanded && v.script && (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {v.script.value_props && v.script.value_props.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Değer önerileri</p>
                <ul className="text-xs text-slate-700 space-y-0.5">
                  {v.script.value_props.slice(0, 4).map((p, i) => (
                    <li key={i} className="flex gap-1"><span className="text-violet-500">•</span> {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {v.script.scenes?.map((s, i) => (
              <div key={i} className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span style={{ fontWeight: 600 }}>Sahne {s.index ?? i + 1}{s.title_tr ? ` — ${s.title_tr}` : ""}</span>
                  <span>{s.duration_seconds ?? "?"}sn</span>
                </div>
                {s.voiceover && <p className="text-xs text-slate-800 mt-1">“{s.voiceover}”</p>}
                {s.caption && <p className="text-[11px] text-slate-500 mt-0.5">CC: {s.caption}</p>}
                {s.visual && <p className="text-[10px] text-slate-400 mt-0.5 italic">Görsel: {s.visual}</p>}
              </div>
            ))}
            {v.cta && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-xs text-emerald-800">
                <span className="text-[10px] uppercase tracking-wide opacity-70">CTA</span>
                <p style={{ fontWeight: 500 }}>{v.cta}</p>
              </div>
            )}
            {v.script.hashtags && v.script.hashtags.length > 0 && (
              <p className="text-[10px] text-slate-500">{v.script.hashtags.join(" ")}</p>
            )}
            {v.script.compliance_notes && v.script.compliance_notes.length > 0 && (
              <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-1.5">
                <span style={{ fontWeight: 600 }}>Uyum notları: </span>
                {v.script.compliance_notes.join(" • ")}
              </div>
            )}
          </div>
        )}

        {v.url && (
          <a
            href={v.url}
            download
            className="mt-3 inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"
          >
            <Download className="w-3 h-3" /> İndir
          </a>
        )}
        {v.error && !isPreview && <p className="mt-2 text-xs text-rose-600">{v.error.slice(0, 100)}</p>}
        {isPreview && v.error && (
          <p className="mt-2 text-[10px] text-slate-500 italic">{v.error.slice(0, 140)}</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VideoRow["status"] }) {
  const map: Record<VideoRow["status"], string> = {
    queued: "bg-slate-100 text-slate-600",
    rendering: "bg-violet-50 text-violet-700",
    ready: "bg-emerald-50 text-emerald-700",
    failed: "bg-rose-50 text-rose-700",
    preview: "bg-amber-50 text-amber-700",
  };
  const labels: Record<VideoRow["status"], string> = {
    queued: "Sırada",
    rendering: "Render",
    ready: "Hazır",
    failed: "Başarısız",
    preview: "Preview",
  };
  return <span className={`px-2 py-0.5 rounded-full ${map[status]}`}>{labels[status]}</span>;
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl tracking-tight" style={{ fontWeight: 600 }}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({
  hasMarkets, onCreate, onRenderAll, busy,
}: {
  hasMarkets: boolean;
  onCreate: () => void;
  onRenderAll: () => void;
  busy: boolean;
}) {
  if (!hasMarkets) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500">
        Önce <span className="text-emerald-600">Başla</span> sayfasından bir analiz çalıştır.
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-4">
      <Film className="w-10 h-10 text-violet-500 mx-auto" />
      <div>
        <p style={{ fontWeight: 600 }}>Henüz video yok</p>
        <p className="text-sm text-slate-500 mt-1">İlk 4 pazarın için Pazar Spotu üretelim.</p>
      </div>
      <div className="flex gap-2 justify-center">
        <button
          onClick={onRenderAll}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm flex items-center gap-1.5 hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
          Top 4 pazara render
        </button>
        <button
          onClick={onCreate}
          className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm hover:bg-slate-50"
        >
          Tek tek seç
        </button>
      </div>
    </div>
  );
}

function RenderPicker({
  markets, onClose, onConfirm,
}: {
  markets: MarketRow[];
  onClose: () => void;
  onConfirm: (marketId: string, composition: VideoComposition) => void;
}) {
  const [marketId, setMarketId] = useState(markets[0]?.id ?? "");
  const [composition, setComposition] = useState<VideoComposition>("MarketSpotlight");

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 style={{ fontWeight: 600 }}>Yeni video</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Pazar</label>
          <select
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm"
          >
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.flag ?? "🌍"} {m.country} — uyum {m.fit_score}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Composition</label>
          <div className="space-y-1.5">
            {COMPOSITIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => setComposition(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm flex items-center justify-between transition ${
                  composition === c.id
                    ? "bg-violet-50 border-violet-300 text-violet-900"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{c.label}</span>
                <span className="text-xs text-slate-500">{c.ratio}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => marketId && onConfirm(marketId, composition)}
          disabled={!marketId}
          className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-50"
        >
          Render et
        </button>
      </div>
    </div>
  );
}
