import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Globe2, Leaf, Phone, Film } from "lucide-react";

const fxData = [
  { d: "Pzt", v: 32.1 }, { d: "Sal", v: 32.4 }, { d: "Çar", v: 32.3 },
  { d: "Per", v: 32.7 }, { d: "Cum", v: 33.0 }, { d: "Cmt", v: 33.2 }, { d: "Paz", v: 33.5 },
];

const carbonData = [
  { d: "Hava", v: 820 }, { d: "Kara", v: 240 }, { d: "Deniz", v: 90 }, { d: "Demir", v: 60 },
];

const markets = [
  { country: "Almanya", flag: "🇩🇪", score: 94, marketplace: "Otto, Amazon.de", trend: "up" },
  { country: "Hollanda", flag: "🇳🇱", score: 89, marketplace: "Bol.com", trend: "up" },
  { country: "BAE", flag: "🇦🇪", score: 86, marketplace: "Noon, Amazon.ae", trend: "up" },
  { country: "Japonya", flag: "🇯🇵", score: 78, marketplace: "Rakuten", trend: "down" },
];

const revenue = [
  { d: "Oca", v: 12 }, { d: "Şub", v: 18 }, { d: "Mar", v: 24 },
  { d: "Nis", v: 31 }, { d: "May", v: 42 }, { d: "Haz", v: 58 },
];

export function Dashboard() {
  return (
    <section id="dashboard" className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-12">
        <p className="text-sm text-emerald-600 mb-2">Komuta merkezi</p>
        <h2 className="text-4xl tracking-tight" style={{ fontWeight: 600 }}>
          Tüm büyüme metriklerin tek panelde
        </h2>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-xl shadow-slate-200/40">
        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Globe2} label="Aktif pazaryeri" value="12" trend="+3" color="emerald" />
          <StatCard icon={Film} label="Üretilen video" value="48" trend="+11" color="violet" />
          <StatCard icon={Phone} label="AI çağrı (bu ay)" value="1.247" trend="+22%" color="sky" />
          <StatCard icon={Leaf} label="Karbon tasarrufu" value="3.2 t" trend="-18%" color="green" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Revenue */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500">Tahmini ihracat geliri</p>
                <p className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>€58.420</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +38%
              </span>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FX */}
          <div className="rounded-2xl bg-slate-900 text-white p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">EUR/TRY · 7 gün tahmini</p>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">AI</span>
            </div>
            <p className="text-2xl tracking-tight mb-3" style={{ fontWeight: 600 }}>33.50 ₺</p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fxData}>
                  <Line type="monotone" dataKey="v" stroke="#fbbf24" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, background: "#1e293b", border: "none", color: "#fff" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2">Tedarik süresi 7 gün için marj koruması: +%4.3</p>
          </div>

          {/* Markets */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontWeight: 600 }}>Önerilen pazaryerleri</p>
              <span className="text-xs text-slate-500">Uyum skoru</span>
            </div>
            <div className="space-y-3">
              {markets.map((m) => (
                <div key={m.country} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                  <span className="text-2xl">{m.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm" style={{ fontWeight: 500 }}>{m.country}</p>
                    <p className="text-xs text-slate-500">{m.marketplace}</p>
                  </div>
                  <div className="w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${m.score}%` }} />
                  </div>
                  <span className="text-sm w-10 text-right tabular-nums">{m.score}</span>
                  {m.trend === "up" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Carbon */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4" />
              <p className="text-xs">Karbon (kg CO₂ / ton·km)</p>
            </div>
            <p className="text-2xl tracking-tight mb-3" style={{ fontWeight: 600 }}>Deniz önerilir</p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={carbonData}>
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#fff" }} />
                  <Bar dataKey="v" fill="rgba(255,255,255,0.85)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs opacity-90 mt-2">İstanbul → Rotterdam · 14 gün · €0.41/kg</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }: any) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-slate-500">{trend}</span>
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl tracking-tight" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
