import { Play, Plus, Film, Clock, Globe, MoreVertical } from "lucide-react";

const videos = [
  { id: 1, title: "DE — Gül suyu kış kampanyası", lang: "DE", duration: "30sn", views: "12.4K", status: "Yayında", ratio: "9:16", color: "from-violet-500 to-fuchsia-500" },
  { id: 2, title: "NL — Bol.com lansman", lang: "NL", duration: "15sn", views: "8.1K", status: "Yayında", ratio: "1:1", color: "from-amber-500 to-orange-500" },
  { id: 3, title: "AE — Premium kutu reels", lang: "AR", duration: "45sn", views: "3.2K", status: "Render", ratio: "9:16", color: "from-rose-500 to-pink-500" },
  { id: 4, title: "UK — Black Friday", lang: "EN", duration: "30sn", views: "—", status: "Taslak", ratio: "16:9", color: "from-sky-500 to-blue-500" },
  { id: 5, title: "JP — Rakuten tanıtım", lang: "JA", duration: "60sn", views: "—", status: "Sırada", ratio: "9:16", color: "from-emerald-500 to-teal-500" },
  { id: 6, title: "DE — Ürün anlatım", lang: "DE", duration: "20sn", views: "5.7K", status: "Yayında", ratio: "1:1", color: "from-indigo-500 to-violet-500" },
];

export function VideosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Video Stüdyosu</h1>
          <p className="text-sm text-slate-500 mt-1">Remotion ile çok dilli pazarlama videoları</p>
        </div>
        <button className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm flex items-center gap-1.5 hover:bg-violet-700">
          <Plus className="w-3.5 h-3.5" /> Yeni video
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat icon={Film} label="Toplam video" value="48" />
        <Stat icon={Globe} label="Dil" value="7" />
        <Stat icon={Clock} label="Render kuyruğu" value="3" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((v) => (
          <div key={v.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden group">
            <div className={`relative aspect-video bg-gradient-to-br ${v.color} flex items-center justify-center`}>
              <button className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition">
                <Play className="w-5 h-5 text-slate-900 ml-0.5" />
              </button>
              <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded bg-black/40 text-white backdrop-blur">{v.lang}</span>
              <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-black/40 text-white backdrop-blur">{v.ratio}</span>
              <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded bg-black/60 text-white">{v.duration}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm" style={{ fontWeight: 500 }}>{v.title}</p>
                <button className="p-1 rounded hover:bg-slate-100 shrink-0"><MoreVertical className="w-3.5 h-3.5 text-slate-400" /></button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>{v.views} görüntüleme</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  v.status === "Yayında" ? "bg-emerald-50 text-emerald-700" :
                  v.status === "Render" ? "bg-violet-50 text-violet-700" :
                  v.status === "Taslak" ? "bg-slate-100 text-slate-600" :
                  "bg-amber-50 text-amber-700"
                }`}>{v.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
