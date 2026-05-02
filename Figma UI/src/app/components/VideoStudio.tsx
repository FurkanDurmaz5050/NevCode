import { useEffect, useState } from "react";
import { Play, Loader2, Check, Download } from "lucide-react";
import type { VideoBrief } from "../lib/analyzer";

export function VideoStudio({ briefs }: { briefs: VideoBrief[] }) {
  const [videos, setVideos] = useState<VideoBrief[]>(briefs);

  useEffect(() => { setVideos(briefs); }, [briefs]);

  const renderAll = () => {
    setVideos((prev) => prev.map((v) => ({ ...v, status: "rendering" as const, progress: 0 })));
    videos.forEach((_, idx) => {
      const interval = setInterval(() => {
        setVideos((prev) => {
          const next = [...prev];
          const v = next[idx];
          if (!v) return prev;
          const newProgress = Math.min(100, v.progress + 8 + Math.random() * 12);
          next[idx] = {
            ...v,
            progress: newProgress,
            status: newProgress >= 100 ? "ready" : "rendering",
          };
          if (newProgress >= 100) clearInterval(interval);
          return next;
        });
      }, 400 + idx * 120);
    });
  };

  const allReady = videos.every((v) => v.status === "ready");
  const anyRendering = videos.some((v) => v.status === "rendering");

  return (
    <div>
      <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
        {videos.map((v) => (
          <div key={v.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">{v.language}</span>
                <p className="text-sm" style={{ fontWeight: 500 }}>{v.market}</p>
                <span className="text-xs text-slate-500">· {v.duration}sn</span>
              </div>
              {v.status === "ready" ? (
                <button className="flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="w-3 h-3" /> Hazır
                </button>
              ) : v.status === "rendering" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
              ) : (
                <span className="text-xs text-slate-400">Sırada</span>
              )}
            </div>
            <p className="text-xs text-slate-600 italic">"{v.hook}"</p>
            {(v.status === "rendering" || v.status === "ready") && (
              <div className="mt-2 h-1 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                  style={{ width: `${v.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={renderAll}
          disabled={anyRendering}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm flex items-center justify-center gap-2 hover:bg-violet-700 transition disabled:opacity-60"
        >
          {anyRendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {anyRendering ? "Render ediliyor..." : "Tümünü Remotion ile üret"}
        </button>
        {allReady && (
          <button className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm flex items-center gap-1.5">
            <Download className="w-4 h-4" /> İndir
          </button>
        )}
      </div>
    </div>
  );
}
