import { Globe2, Film, PhoneCall, Leaf, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

const revenue = [
  { d: "Oca", v: 12 }, { d: "Şub", v: 18 }, { d: "Mar", v: 24 },
  { d: "Nis", v: 31 }, { d: "May", v: 42 }, { d: "Haz", v: 58 }, { d: "Tem", v: 71 },
];
const channelData = [
  { name: "Otto", v: 32, color: "#ef4444" },
  { name: "Bol.com", v: 28, color: "#3b82f6" },
  { name: "Amazon DE", v: 22, color: "#f59e0b" },
  { name: "Noon", v: 18, color: "#10b981" },
];
const orders = [
  { id: "#GN-2841", market: "🇩🇪 Almanya", product: "Gül suyu 100ml", value: "€18.40", status: "Kargoda" },
  { id: "#GN-2840", market: "🇳🇱 Hollanda", product: "Set 3'lü", value: "€42.00", status: "Hazırlanıyor" },
  { id: "#GN-2839", market: "🇦🇪 BAE", product: "Premium kutu", value: "€68.00", status: "Teslim edildi" },
  { id: "#GN-2838", market: "🇬🇧 İngiltere", product: "Mini set", value: "€24.10", status: "Kargoda" },
];

export function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Genel Bakış</h1>
        <p className="text-sm text-slate-500 mt-1">Son 30 günde 38% gelir artışı, 4 yeni pazaryeri.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Globe2} label="Aktif pazaryeri" value="12" delta="+3" up color="emerald" />
        <Stat icon={Film} label="Üretilen video" value="48" delta="+11" up color="violet" />
        <Stat icon={PhoneCall} label="AI çağrı" value="1.247" delta="+22%" up color="sky" />
        <Stat icon={Leaf} label="Karbon tasarrufu" value="3.2 t" delta="-18%" up color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">İhracat geliri</p>
              <p className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>€71.420</p>
            </div>
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-3 h-3" /> +38%
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#rev2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Kanal dağılımı</p>
          <p className="text-lg tracking-tight mb-3" style={{ fontWeight: 600 }}>Bu ay</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} dataKey="v" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {channelData.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontWeight: 600 }}>Son siparişler</p>
            <button className="text-xs text-emerald-600 hover:underline">Tümünü gör →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-200">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Pazar</th>
                  <th className="text-left py-2">Ürün</th>
                  <th className="text-right py-2">Tutar</th>
                  <th className="text-right py-2">Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 tabular-nums text-slate-600">{o.id}</td>
                    <td className="py-3">{o.market}</td>
                    <td className="py-3">{o.product}</td>
                    <td className="py-3 text-right tabular-nums" style={{ fontWeight: 500 }}>{o.value}</td>
                    <td className="py-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === "Teslim edildi" ? "bg-emerald-50 text-emerald-700" :
                        o.status === "Kargoda" ? "bg-sky-50 text-sky-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, delta, up, color }: any) {
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
        <span className={`text-xs flex items-center gap-0.5 ${up ? "text-emerald-600" : "text-rose-600"}`}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {delta}
        </span>
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl tracking-tight" style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
